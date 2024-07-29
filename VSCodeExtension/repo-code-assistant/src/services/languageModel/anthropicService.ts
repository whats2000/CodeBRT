import vscode from 'vscode';
import fs from 'fs';
import path from 'path';
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
import Anthropic from '@anthropic-ai/sdk';

import type { ConversationEntry, GetResponseOptions } from '../../types';
import { SettingsManager } from '../../api';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import { webSearchSchema } from '../../constants';
import { ToolService } from '../tools';

export class AnthropicService extends AbstractLanguageModelService {
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  private readonly tools: Tool[] = [
    {
      name: webSearchSchema.name,
      description: webSearchSchema.description,
      input_schema: webSearchSchema.inputSchema as Tool.InputSchema,
    },
  ];

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get('anthropicAvailableModels');
    const defaultModelName = settingsManager.get('lastSelectedModel').anthropic;

    super(
      'anthropic',
      context,
      'anthropicConversationHistory.json',
      settingsManager,
      defaultModelName,
      availableModelNames,
    );
    this.apiKey = settingsManager.get('anthropicApiKey');

    // Initialize and load conversation history
    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize Anthropic Service: ' + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('repo-code-assistant.anthropicApiKey')) {
        this.apiKey = settingsManager.get('anthropicApiKey');
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistories();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to initialize Anthropic Service History: ' + error,
      );
    }
  }

  private conversationHistoryToContent(
    entries: { [key: string]: ConversationEntry },
    query: string,
  ): MessageParam[] {
    const result: MessageParam[] = [];
    let currentEntry = entries[this.history.current];

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
    if (result.length > 0 && result[result.length - 1].role !== 'user') {
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
    currentEntryID?: string,
    images?: string[],
  ): {
    anthropic: Anthropic;
    conversationHistory: MessageParam[];
    errorMessage?: string;
  } {
    const anthropic = new Anthropic({
      apiKey: this.apiKey,
    });

    if (this.currentModel === '') {
      vscode.window
        .showErrorMessage(
          'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
        )
        .then();
      return {
        anthropic: anthropic,
        conversationHistory: [],
        errorMessage:
          'Missing model configuration. Check the model selection dropdown.',
      };
    }

    const conversationHistory = this.conversationHistoryToContent(
      this.getHistoryBeforeEntry(currentEntryID).entries,
      query,
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
        vscode.window
          .showErrorMessage(`Unsupported image file type: ${fileType}`)
          .then();

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

      // Filter the invalid models (Not existing in the latest models)
      newAvailableModelNames = newAvailableModelNames.filter((name) =>
        latestModels.some((model) => model === name),
      );

      // Append the models to the available models if they are not already there
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
    const { query, images, currentEntryID, sendStreamResponse, updateStatus } =
      options;

    const { anthropic, conversationHistory, errorMessage } = this.initModel(
      query,
      currentEntryID,
      images,
    );

    if (errorMessage) {
      return errorMessage;
    }

    const requestData = {
      max_tokens: 4096,
      model: this.currentModel,
      messages: conversationHistory,
    };

    try {
      if (!sendStreamResponse) {
        const result = await anthropic.messages.create({
          ...requestData,
          tools: this.tools,
        });

        if (result.content[0].type === 'tool_use') {
          const toolUseBlock = result.content.filter(
            (message) => message.type === 'tool_use',
          ) as ToolUseBlock[];
          const functionCallResults = await this.handleFunctionCalls(
            toolUseBlock,
            updateStatus,
          );

          requestData.messages.push({
            role: 'assistant',
            content: toolUseBlock,
          });

          requestData.messages.push({
            role: 'user',
            content: functionCallResults,
          });

          const newResult = await anthropic.messages.create({
            ...requestData,
            tools: this.tools,
          });

          return (newResult.content[0] as TextBlock).text;
        }

        return (result.content[0] as TextBlock).text;
      }

      const stream = anthropic.messages
        .stream({ ...requestData, tools: this.tools, stream: true })
        .on('text', (text) => {
          sendStreamResponse(text);
        });

      const finalMessage = await stream.finalMessage();

      if (finalMessage.stop_reason === 'tool_use') {
        const toolUseBlock = finalMessage.content.filter(
          (message) => message.type === 'tool_use',
        ) as ToolUseBlock[];
        const functionCallResults = await this.handleFunctionCalls(
          toolUseBlock,
          updateStatus,
        );

        requestData.messages.push({
          role: 'assistant',
          content: toolUseBlock,
        });

        requestData.messages.push({
          role: 'user',
          content: functionCallResults,
        });

        updateStatus && updateStatus('');

        const stream = anthropic.messages
          .stream({ ...requestData, tools: this.tools, stream: true })
          .on('text', (text) => {
            sendStreamResponse(text);
          });

        return await stream.finalText();
      }

      return await stream.finalText();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Anthropic Service: ' + error,
      );
      return 'Failed to connect to the language model service';
    }
  }
}
