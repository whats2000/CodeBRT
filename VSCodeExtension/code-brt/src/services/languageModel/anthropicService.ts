import fs from 'fs';
import path from 'path';

import vscode from 'vscode';
import axios from 'axios';
import * as cheerio from 'cheerio';
import type {
  ImageBlockParam,
  MessageParam,
  TextBlock,
  TextBlockParam,
  Tool,
  ToolUseBlock,
  ToolResultBlockParam,
} from '@anthropic-ai/sdk/src/resources';
import type {
  MessageCreateParamsNonStreaming,
  MessageStream,
} from '@anthropic-ai/sdk/resources/messages';
import Anthropic from '@anthropic-ai/sdk';

import {
  ConversationEntry,
  GetResponseOptions,
  ToolServiceType,
} from '../../types';
import { MODEL_SERVICE_CONSTANTS, toolsSchema } from '../../constants';
import { HistoryManager, SettingsManager } from '../../api';
import { AbstractLanguageModelService } from './base';
import { ToolService } from '../tools';

export class AnthropicService extends AbstractLanguageModelService {
  private currentStreamResponse: MessageStream | undefined;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get('anthropicAvailableModels');
    const defaultModelName = settingsManager.get('lastSelectedModel').anthropic;

    super(
      'anthropic',
      context,
      settingsManager,
      defaultModelName,
      availableModelNames,
    );
  }

  private getAdvanceSettings(historyManager: HistoryManager): {
    systemPrompt: string | undefined;
    generationConfig: Partial<MessageCreateParamsNonStreaming> & {
      max_tokens: number;
    };
  } {
    const advanceSettings = historyManager.getCurrentHistory().advanceSettings;

    if (!advanceSettings) {
      return {
        systemPrompt: undefined,
        generationConfig: {
          max_tokens: 4096,
        },
      };
    }

    if (advanceSettings.presencePenalty || advanceSettings.frequencyPenalty) {
      void vscode.window.showWarningMessage(
        'Presence and frequency penalties are not supported by the Anthropic API, so the settings will be ignored.',
      );
    }

    const generationConfig: Partial<MessageCreateParamsNonStreaming> = {};
    if (advanceSettings.temperature) {
      generationConfig.temperature = advanceSettings.temperature;
    }
    if (advanceSettings.topP) {
      generationConfig.top_p = advanceSettings.topP;
    }
    if (advanceSettings.topK) {
      generationConfig.top_k = advanceSettings.topK;
    }

    return {
      systemPrompt:
        advanceSettings.systemPrompt.length > 0
          ? advanceSettings.systemPrompt
          : undefined,
      generationConfig: {
        max_tokens: advanceSettings.maxTokens ?? 4096,
        ...generationConfig,
      },
    };
  }

  private getEnabledTools(): Tool[] | undefined {
    const enabledTools = this.settingsManager.get('enableTools');
    const tools: Tool[] = [];
    for (const [key, tool] of Object.entries(toolsSchema)) {
      if (!enabledTools[key as ToolServiceType].active) {
        continue;
      }

      tools.push({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema as Tool.InputSchema,
      });
    }

    return tools.length > 0 ? tools : undefined;
  }

  private conversationHistoryToContent(
    entries: { [key: string]: ConversationEntry },
    query: string,
    historyManager: HistoryManager,
  ): MessageParam[] {
    const result: MessageParam[] = [];
    let currentEntry = entries[historyManager.getCurrentHistory().current];

    while (currentEntry) {
      result.unshift({
        role: currentEntry.role === 'user' ? 'user' : 'assistant',
        content: [
          {
            type: 'text',
            text: currentEntry.message,
          },
        ],
      });

      if (currentEntry.parent) {
        currentEntry = entries[currentEntry.parent];
      } else {
        break;
      }
    }

    // Anthropic's API requires the query message at the end of the history
    if (result[result.length - 1]?.role !== 'user') {
      result.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: query,
          },
        ],
      });
    }

    return result;
  }

  private fileToImagePart(
    filePath: string,
    mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
  ): ImageBlockParam | undefined {
    try {
      const base64Data = fs.readFileSync(filePath).toString('base64');
      return {
        type: 'image',
        source: {
          type: 'base64',
          data: base64Data,
          media_type: mimeType,
        },
      };
    } catch (error) {
      console.error('Failed to read image file:', error);
    }
  }

  private initModel(
    query: string,
    historyManager: HistoryManager,
    currentEntryID?: string,
    images?: string[],
  ): {
    anthropic: Anthropic;
    conversationHistory: MessageParam[];
    errorMessage?: string;
  } {
    const anthropic = new Anthropic({
      apiKey: this.settingsManager.get('anthropicApiKey'),
    });

    if (this.currentModel === '') {
      void vscode.window.showErrorMessage(
        'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
      );
      return {
        anthropic: anthropic,
        conversationHistory: [],
        errorMessage:
          'Missing model configuration. Check the model selection dropdown.',
      };
    }

    const conversationHistory = this.conversationHistoryToContent(
      historyManager.getHistoryBeforeEntry(currentEntryID).entries,
      query,
      historyManager,
    );

    if (!images) {
      return {
        anthropic,
        conversationHistory,
      };
    }

    for (const image of images) {
      const fileType = path.extname(image).slice(1);
      if (!['jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
        void vscode.window.showErrorMessage(
          `Unsupported image file type: ${fileType}`,
        );

        return {
          anthropic,
          conversationHistory,
          errorMessage: 'Unsupported image file type',
        };
      }
    }

    // Append the images to last message
    const imageParts = images
      .map((image) => {
        const mimeType = `image/${path.extname(image).slice(1)}` as
          | 'image/jpeg'
          | 'image/png'
          | 'image/gif'
          | 'image/webp';
        return this.fileToImagePart(image, mimeType);
      })
      .filter((part) => part !== undefined) as ImageBlockParam[];

    (
      conversationHistory[conversationHistory.length - 1].content as (
        | TextBlockParam
        | ImageBlockParam
      )[]
    ).push(...imageParts);

    return {
      anthropic,
      conversationHistory,
    };
  }

  private handleFunctionCalls = async (
    functionCalls: ToolUseBlock[],
    updateStatus?: (status: string) => void,
  ): Promise<ToolResultBlockParam[]> => {
    const functionCallResults: ToolResultBlockParam[] = [];

    for (const functionCall of functionCalls) {
      const tool = ToolService.getTool(functionCall.name);
      if (!tool) {
        functionCallResults.push({
          type: 'tool_result',
          tool_use_id: functionCall.id,
          content: 'Failed to find tool with name: ' + functionCall.name,
          is_error: true,
        });
        continue;
      }

      try {
        const args = { ...(functionCall.input as object), updateStatus };
        const result = await tool(args as any);
        functionCallResults.push({
          type: 'tool_result',
          tool_use_id: functionCall.id,
          content: result,
          is_error: false,
        });
      } catch (error) {
        functionCallResults.push({
          type: 'tool_result',
          tool_use_id: functionCall.id,
          content: `Error executing tool ${functionCall.name}: ${error}`,
          is_error: true,
        });
      }
    }

    return functionCallResults;
  };

  public async getLatestAvailableModelNames(): Promise<string[]> {
    const requestUrl = `https://docs.anthropic.com/en/docs/about-claude/models`;

    let newAvailableModelNames: string[] = [...this.availableModelNames];

    try {
      const response = await axios.get(requestUrl).catch(console.error);

      if (!response || response.status !== 200) {
        vscode.window.showErrorMessage(
          'Failed to fetch available models from Anthropic',
        );
        return this.availableModelNames;
      }

      const htmlData = cheerio.load(response.data);
      const table = htmlData('table:has(thead:contains("Model"))');
      const rows = table.find('tbody > tr');

      const latestModels: string[] = [];
      rows.each((_index, row) => {
        const modelCode = htmlData(row).find('td:nth-child(2) code').text();
        if (modelCode) {
          latestModels.push(modelCode);
        }
      });

      // Filter the invalid models from the available models
      newAvailableModelNames = newAvailableModelNames.filter((name) =>
        latestModels.some((model) => model === name),
      );

      // Append the models to the available models if they aren't already there
      latestModels.forEach((model) => {
        if (newAvailableModelNames.includes(model)) return;

        newAvailableModelNames.push(model);
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to fetch available models: ' + error,
      );
    }

    return newAvailableModelNames;
  }

  public async getResponse(options: GetResponseOptions): Promise<string> {
    const {
      query,
      historyManager,
      images,
      currentEntryID,
      sendStreamResponse,
      updateStatus,
      selectedModelName,
    } = options;

    const { anthropic, conversationHistory, errorMessage } = this.initModel(
      query,
      historyManager,
      currentEntryID,
      images,
    );

    if (errorMessage) {
      return errorMessage;
    }

    let functionCallCount = 0;
    const MAX_FUNCTION_CALLS = 5;

    const { systemPrompt, generationConfig } =
      this.getAdvanceSettings(historyManager);

    try {
      if (!sendStreamResponse) {
        while (functionCallCount < MAX_FUNCTION_CALLS) {
          const response = await anthropic.messages.create({
            model: selectedModelName ?? this.currentModel,
            system: systemPrompt,
            messages: conversationHistory,
            tools: this.getEnabledTools(),
            stream: false,
            ...generationConfig,
          });

          if (response.content[0].type !== 'tool_use') {
            return (response.content[0] as TextBlock).text;
          }

          const toolUseBlock = response.content.filter(
            (message) => message.type === 'tool_use',
          ) as ToolUseBlock[];
          const functionCallResults =
            await this.handleFunctionCalls(toolUseBlock);

          conversationHistory.push({
            role: 'assistant',
            content: toolUseBlock,
          });

          conversationHistory.push({
            role: 'user',
            content: functionCallResults,
          });

          functionCallCount++;
        }
        return 'Max function call limit reached.';
      } else {
        let responseText = '';

        while (functionCallCount < MAX_FUNCTION_CALLS) {
          this.currentStreamResponse?.abort();
          this.currentStreamResponse = anthropic.messages
            .stream({
              model: selectedModelName ?? this.currentModel,
              system: systemPrompt,
              messages: conversationHistory,
              tools: this.getEnabledTools(),
              stream: true,
              ...generationConfig,
            })
            .on('connect', () => {
              updateStatus && updateStatus('');
            })
            .on('text', (partText) => {
              sendStreamResponse(partText);
              responseText += partText;
            });

          const finalMessage = await this.currentStreamResponse.finalMessage();

          if (finalMessage.stop_reason !== 'tool_use') {
            return responseText;
          }

          const toolUseBlock = finalMessage.content.filter(
            (message) => message.type === 'tool_use',
          ) as ToolUseBlock[];

          const functionCallResults = await this.handleFunctionCalls(
            toolUseBlock,
            updateStatus,
          );

          conversationHistory.push({
            role: 'assistant',
            content: toolUseBlock,
          });

          conversationHistory.push({
            role: 'user',
            content: functionCallResults,
          });

          functionCallCount++;
        }
        return 'Max function call limit reached.';
      }
    } catch (error) {
      vscode.window
        .showErrorMessage(
          'Failed to get response from Anthropic Service: ' + error,
          'Get API Key',
        )
        .then((selection) => {
          if (selection === 'Get API Key') {
            vscode.env.openExternal(
              vscode.Uri.parse(MODEL_SERVICE_CONSTANTS.anthropic.apiLink),
            );
          }
        });

      return 'Failed to connect to the language model service';
    } finally {
      updateStatus && updateStatus('');
    }
  }

  public async stopResponse(): Promise<void> {
    if (this.currentStreamResponse) {
      this.currentStreamResponse.abort();
    }
  }
}
