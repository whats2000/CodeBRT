import * as vscode from 'vscode';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import {
  ChatCompletionMessageParam,
  ChatCompletionContentPartImage,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionCreateParamsNonStreaming,
} from 'openai/src/resources/chat/completions';

import { ConversationEntry } from '../../types/conversationHistory';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import SettingsManager from '../../api/settingsManager';

export class OpenAIService extends AbstractLanguageModelService {
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get(
      'openAiAvailableModels',
    ) || ['gpt-3.5-turbo', 'gpt-4o'];
    const defaultModelName = availableModelNames[0];

    super(
      context,
      'openAIConversationHistory.json',
      settingsManager,
      defaultModelName,
      availableModelNames,
    );
    this.apiKey = settingsManager.get('openAiApiKey');

    // Initialize and load conversation history
    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize OpenAI Service: ' + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration('repo-code-assistant.openAiApiKey') ||
        e.affectsConfiguration('repo-code-assistant.openAiAvailableModels')
      ) {
        this.apiKey = settingsManager.get('openAiApiKey');
        this.availableModelNames = settingsManager.get(
          'openAiAvailableModels',
        ) || ['gpt-3.5-turbo', 'gpt-4o'];
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistories();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to initialize OpenAI Service History: ' + error,
      );
    }
  }

  private conversationHistoryToContent(
    entries: { [key: string]: ConversationEntry },
    query: string,
  ): ChatCompletionMessageParam[] {
    const result: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    let currentEntry = entries[this.history.current];

    while (currentEntry) {
      result.unshift({
        role: currentEntry.role === 'user' ? 'user' : 'assistant',
        content: currentEntry.message,
      });

      if (currentEntry.parent) {
        currentEntry = entries[currentEntry.parent];
      } else {
        break;
      }
    }

    // OpenAI's API requires the query message at the end of the history
    if (result.length > 0 && result[result.length - 1].role !== 'user') {
      result.push({
        role: 'user',
        content: query,
      });
    }

    return result;
  }

  private fileToGenerativePart(
    filePath: string,
    mimeType: string,
  ): ChatCompletionContentPartImage {
    const base64Data = fs.readFileSync(filePath).toString('base64');
    return {
      type: 'image_url',
      image_url: {
        url: `data:${mimeType};base64,${base64Data}`,
      },
    };
  }

  public async getResponseForQuery(
    query: string,
    currentEntryID?: string,
  ): Promise<string> {
    const openai = new OpenAI({
      apiKey: this.apiKey,
    });

    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;
    const conversationHistory = this.conversationHistoryToContent(
      history.entries,
      query,
    );

    try {
      const chatCompletion = await openai.chat.completions.create({
        messages: conversationHistory,
        model: this.currentModel,
      } as ChatCompletionCreateParamsNonStreaming);

      return chatCompletion.choices[0]?.message?.content!;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from OpenAI Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }

  public async getResponseChunksForQuery(
    query: string,
    sendStreamResponse: (msg: string) => void,
    currentEntryID?: string,
  ): Promise<string> {
    const openai = new OpenAI({
      apiKey: this.apiKey,
    });

    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;
    const conversationHistory = this.conversationHistoryToContent(
      history.entries,
      query,
    );

    try {
      const stream = await openai.chat.completions.create({
        messages: conversationHistory,
        model: this.currentModel,
        stream: true,
      } as ChatCompletionCreateParamsStreaming);

      let responseText: string = '';

      // Update streaming response
      for await (const chunk of stream) {
        const partText = chunk.choices[0]?.delta?.content || '';
        sendStreamResponse(partText);
        responseText += partText;
      }

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from OpenAI Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }

  public async getResponseForQueryWithImage(
    query: string,
    images: string[],
    _currentEntryID?: string,
  ): Promise<string> {
    const openai = new OpenAI({ apiKey: this.apiKey });

    try {
      const imageParts = images.map((image) => {
        const mimeType = `image/${path.extname(image).slice(1)}`;
        return this.fileToGenerativePart(image, mimeType);
      });

      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'user',
          content: [{ type: 'text', text: query }, ...imageParts],
        },
      ];

      const chatCompletion = await openai.chat.completions.create({
        model: this.currentModel,
        messages: messages,
      } as ChatCompletionCreateParamsNonStreaming);

      return chatCompletion.choices[0]?.message?.content!;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from OpenAI Service: ' + error,
      );
      return 'Failed to connect to the language model service';
    }
  }

  public async getResponseChunksForQueryWithImage(
    query: string,
    images: string[],
    sendStreamResponse: (msg: string) => void,
    _currentEntryID?: string,
  ): Promise<string> {
    const openai = new OpenAI({ apiKey: this.apiKey });

    try {
      let responseText = '';

      const imageParts = images.map((image) => {
        const mimeType = `image/${path.extname(image).slice(1)}`;
        return this.fileToGenerativePart(image, mimeType);
      });

      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'user',
          content: [{ type: 'text', text: query }, ...imageParts],
        },
      ];

      const stream = await openai.chat.completions.create({
        model: this.currentModel,
        messages: messages,
        stream: true,
      } as ChatCompletionCreateParamsStreaming);

      for await (const chunk of stream) {
        const partText = chunk.choices[0]?.delta?.content || '';
        sendStreamResponse(partText);
        responseText += partText;
      }

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from OpenAI Service: ' + error,
      );
      return 'Failed to connect to the language model service';
    }
  }
}
