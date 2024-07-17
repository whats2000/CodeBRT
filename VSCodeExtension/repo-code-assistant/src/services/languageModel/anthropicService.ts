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
} from '@anthropic-ai/sdk/src/resources/messages';
import Anthropic from '@anthropic-ai/sdk';

import type { ConversationEntry } from '../../types';
import SettingsManager from '../../api/settingsManager';
import { AbstractLanguageModelService } from './abstractLanguageModelService';

export class AnthropicService extends AbstractLanguageModelService {
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get('anthropicAvailableModels');
    const defaultModelName = availableModelNames[0] || '';

    super(
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
        content: query,
      });
    }

    return result;
  }

  private fileToImagePart(
    filePath: string,
    mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
  ): ImageBlockParam {
    const base64Data = fs.readFileSync(filePath).toString('base64');
    return {
      type: 'image',
      source: {
        type: 'base64',
        data: base64Data,
        media_type: mimeType,
      },
    };
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
    if (this.currentModel === '') {
      vscode.window
        .showErrorMessage(
          'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
        )
        .then();
      return {
        anthropic: new Anthropic({
          apiKey: this.apiKey,
        }),
        conversationHistory: [],
        errorMessage:
          'Missing model configuration. Check the model selection dropdown.',
      };
    }

    const anthropic = new Anthropic({
      apiKey: this.apiKey,
    });

    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;
    const conversationHistory = this.conversationHistoryToContent(
      history.entries,
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
    const imageParts = images.map((image) => {
      const mimeType = `image/${path.extname(image).slice(1)}` as
        | 'image/jpeg'
        | 'image/png'
        | 'image/gif'
        | 'image/webp';
      return this.fileToImagePart(image, mimeType);
    });

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

  public async getResponseForQuery(
    query: string,
    currentEntryID?: string,
  ): Promise<string> {
    const { anthropic, conversationHistory, errorMessage } = this.initModel(
      query,
      currentEntryID,
    );

    if (errorMessage) {
      return errorMessage;
    }

    try {
      const message = await anthropic.messages.create({
        max_tokens: 4096,
        messages: conversationHistory,
        model: this.currentModel,
      });

      return (message.content[0] as TextBlock).text;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Anthropic Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }

  public async getResponseChunksForQuery(
    query: string,
    sendStreamResponse: (msg: string) => void,
    currentEntryID?: string,
  ): Promise<string> {
    const { anthropic, conversationHistory, errorMessage } = this.initModel(
      query,
      currentEntryID,
    );

    if (errorMessage) {
      return errorMessage;
    }

    try {
      const stream = anthropic.messages
        .stream({
          max_tokens: 4096,
          messages: conversationHistory,
          model: this.currentModel,
          stream: true,
        })
        .on('text', (text) => {
          sendStreamResponse(text);
        });

      return await stream.finalText();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Anthropic Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }

  public async getResponseForQueryWithImage(
    query: string,
    images: string[],
    currentEntryID?: string,
  ): Promise<string> {
    const { anthropic, conversationHistory, errorMessage } = this.initModel(
      query,
      currentEntryID,
      images,
    );

    if (errorMessage) {
      return errorMessage;
    }

    try {
      const message = await anthropic.messages.create({
        max_tokens: 4096,
        model: this.currentModel,
        messages: conversationHistory,
      });

      return (message.content[0] as TextBlock).text;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Anthropic Service: ' + error,
      );
      return 'Failed to connect to the language model service';
    }
  }

  public async getResponseChunksForQueryWithImage(
    query: string,
    images: string[],
    sendStreamResponse: (msg: string) => void,
    currentEntryID?: string,
  ): Promise<string> {
    const { anthropic, conversationHistory, errorMessage } = this.initModel(
      query,
      currentEntryID,
      images,
    );

    if (errorMessage) {
      return errorMessage;
    }

    try {
      const stream = anthropic.messages
        .stream({
          max_tokens: 4096,
          model: this.currentModel,
          messages: conversationHistory,
          stream: true,
        })
        .on('text', (text) => {
          sendStreamResponse(text);
        });

      return await stream.finalText();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Anthropic Service: ' + error,
      );
      return 'Failed to connect to the language model service';
    }
  }
}
