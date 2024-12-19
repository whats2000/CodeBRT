import path from 'path';

import vscode from 'vscode';
import axios from 'axios';
import * as cheerio from 'cheerio';
import type {
  ImageBlockParam,
  MessageParam,
  TextBlockParam,
  Tool,
  ToolResultBlockParam,
  ToolUseBlock,
} from '@anthropic-ai/sdk/src/resources';
import type {
  MessageCreateParamsBase,
  MessageCreateParamsNonStreaming,
} from '@anthropic-ai/sdk/resources/messages';
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';
import Anthropic from '@anthropic-ai/sdk';

import {
  ConversationEntry,
  GetResponseOptions,
  NonWorkspaceToolType,
  ResponseWithAction,
  ToolCallResponse,
} from '../../types';
import { HistoryManager, SettingsManager } from '../../api';
import { AbstractLanguageModelService } from './base';
import { ToolServiceProvider } from '../tools';
import { fileToBase64 } from './utils';

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
        stop_sequences: advanceSettings.stop,
        ...generationConfig,
      },
    };
  }

  private getEnabledTools(): Tool[] | undefined {
    const enabledTools = this.settingsManager.get('enableTools');
    const tools: Tool[] = [];
    const { agentTools, ...toolsSchema } = ToolServiceProvider.getToolSchema();

    // Add agent tools if enabled
    if (enabledTools.agentTools?.active && agentTools) {
      for (const [key, tool] of Object.entries(agentTools)) {
        tools.push({
          name: key,
          description: tool.description,
          input_schema: tool.inputSchema as Tool.InputSchema,
        });
      }
    }

    for (const [key, tool] of Object.entries(toolsSchema)) {
      if (!enabledTools[key as NonWorkspaceToolType]?.active) {
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
    currentEntryID?: string,
    toolCallResponse?: ToolCallResponse,
  ): MessageParam[] {
    const result: MessageParam[] = [];
    let currentEntry =
      entries[currentEntryID ?? historyManager.getCurrentHistory().current];

    while (currentEntry) {
      switch (currentEntry.role) {
        case 'AI':
          // Anthropic's API requires non-empty messages
          const newEntry: MessageParam = {
            role: 'assistant',
            content: [
              {
                type: 'text',
                text:
                  // The Message is empty or the message only contains '\n' characters
                  currentEntry.message === '' ||
                  /^\n+$/.test(currentEntry.message)
                    ? 'Let continue...'
                    : currentEntry.message,
              },
            ],
          };
          if (typeof newEntry.content === 'string') {
            break;
          }
          const toolCall = currentEntry.toolCalls?.[0];
          if (toolCall) {
            newEntry.content.push({
              type: 'tool_use',
              id: toolCall.id,
              name: toolCall.toolName,
              input: toolCall.parameters,
            });
          }
          result.unshift(newEntry);
          break;
        case 'user':
          result.unshift({
            role: 'user',
            content: [
              {
                type: 'text',
                text: currentEntry.message,
              },
            ],
          });
          break;
        case 'tool':
          const toolCallResponse = currentEntry.toolResponses?.[0];
          if (!toolCallResponse) {
            throw new Error('Tool call response not found');
          }
          result.unshift({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolCallResponse.id,
                content: JSON.stringify(toolCallResponse.result),
                is_error: toolCallResponse.status !== 'success',
              },
            ],
          });
          break;
      }

      if (currentEntry.parent) {
        currentEntry = entries[currentEntry.parent];
      } else {
        break;
      }
    }

    // Anthropic's API requires the query message at the end of the history
    if (result[result.length - 1]?.role !== 'user') {
      const newEntry: MessageParam = {
        role: 'user',
        content: [
          {
            type: 'text',
            text: query,
          },
        ],
      };
      if (toolCallResponse && typeof newEntry.content !== 'string') {
        newEntry.content.push({
          type: 'tool_result',
          tool_use_id: toolCallResponse.id,
          content: JSON.stringify(toolCallResponse.result),
          is_error: toolCallResponse.status === 'error',
        });
      }
      result.push(newEntry);
    }

    return result;
  }

  private async fileToImagePart(
    filePath: string,
  ): Promise<ImageBlockParam | undefined> {
    try {
      const result = await fileToBase64(filePath);

      if (!result) {
        return undefined;
      }

      const { base64Data, mimeType } = result;

      if (
        mimeType !== 'image/jpeg' &&
        mimeType !== 'image/png' &&
        mimeType !== 'image/gif' &&
        mimeType !== 'image/webp'
      ) {
        void vscode.window.showErrorMessage(
          `Unsupported image file type: ${mimeType}`,
        );

        return undefined;
      }

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

  private async initModel(
    query: string,
    historyManager: HistoryManager,
    currentEntryID?: string,
    images?: string[],
    toolCallResponse?: ToolCallResponse,
  ): Promise<{
    anthropic: Anthropic;
    conversationHistory: MessageParam[];
    errorMessage?: string;
  }> {
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
      currentEntryID,
      toolCallResponse,
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
    const imageParts = await Promise.all(
      images.map(async (image) => {
        const imagePart = await this.fileToImagePart(image);
        if (!imagePart) {
          return undefined;
        }
        return imagePart;
      }),
    ).then((parts) =>
      parts.filter((part): part is ImageBlockParam => part !== undefined),
    );

    (
      conversationHistory[conversationHistory.length - 1].content as (
        | ToolResultBlockParam
        | TextBlockParam
        | ImageBlockParam
      )[]
    ).push(...imageParts);

    return {
      anthropic,
      conversationHistory,
    };
  }

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
        const modelCodes = htmlData(row).find('td:nth-child(2) code');
        modelCodes.each((_codeIndex, codeElement) => {
          const modelCode = htmlData(codeElement).text().trim();
          if (modelCode) {
            latestModels.push(modelCode);
          }
        });
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

  public async getResponse(
    options: GetResponseOptions,
  ): Promise<ResponseWithAction> {
    const {
      query,
      historyManager,
      images,
      currentEntryID,
      sendStreamResponse,
      updateStatus,
      selectedModelName,
      disableTools,
      toolCallResponse,
    } = options;

    const { anthropic, conversationHistory, errorMessage } =
      await this.initModel(
        query,
        historyManager,
        currentEntryID,
        images,
        toolCallResponse,
      );

    if (errorMessage) {
      return { textResponse: errorMessage };
    }

    const { systemPrompt, generationConfig } =
      this.getAdvanceSettings(historyManager);

    const MAX_RETRIES = 5;
    let retryCount = 0;
    let responseText = '';
    let response;
    updateStatus && updateStatus('');

    try {
      while (retryCount < MAX_RETRIES) {
        const requestPayload: MessageCreateParamsBase = {
          model: selectedModelName ?? this.currentModel,
          system: systemPrompt,
          messages: conversationHistory,
          tools: disableTools ? undefined : this.getEnabledTools(),
          ...generationConfig,
        };
        if (!sendStreamResponse) {
          response = await anthropic.messages.create({
            ...requestPayload,
            stream: false,
          });
          if (response.content[0].type === 'text') {
            responseText = response.content[0].text;
          }
        } else {
          this.currentStreamResponse?.abort();
          this.currentStreamResponse = anthropic.messages
            .stream({
              ...requestPayload,
              stream: true,
            })
            .on('inputJson', () => {
              updateStatus &&
                updateStatus(`[processing] I'm creating an action...`);
            })
            .on('text', (partText) => {
              sendStreamResponse(partText);
              responseText += partText;
            });

          response = await this.currentStreamResponse.finalMessage();
        }

        // Return the response is no tool calls are present
        if (response.stop_reason !== 'tool_use') {
          return { textResponse: responseText };
        }

        const toolUseBlock = response.content.filter(
          (message) => message.type === 'tool_use',
        ) as ToolUseBlock[];
        const toolCall = {
          id: toolUseBlock[0].id,
          toolName: toolUseBlock[0].name,
          parameters: toolUseBlock[0].input as Record<string, any>,
          create_time: Date.now(),
        };

        const validation = ToolServiceProvider.isViableToolCall(toolCall);
        // Return the response if the tool call is valid
        if (validation.isValid) {
          return {
            textResponse: responseText,
            toolCall,
          };
        }

        // Otherwise, add the tool call feedback to the conversation history and retry
        conversationHistory.push({
          role: 'assistant',
          content: [toolUseBlock[0]],
        });
        conversationHistory.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolUseBlock[0].id,
              content: validation.feedback,
              is_error: true,
            },
          ],
        });
        retryCount++;
      }
      return { textResponse: responseText };
    } catch (error) {
      return this.handleGetResponseError(error, 'anthropic', responseText);
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
