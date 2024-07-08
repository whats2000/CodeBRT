import * as vscode from 'vscode';
import fs from 'fs';
import type { ChatResponse, Message, Options } from 'ollama';
import { Ollama } from 'ollama';

import type { ConversationEntry } from '../../types';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import SettingsManager from '../../api/settingsManager';

export class OllamaService extends AbstractLanguageModelService {
  private clientHost: string;
  private readonly settingsListener: vscode.Disposable;

  private readonly generationConfig: Partial<Options> = {
    temperature: 1,
    top_p: 0.95,
    top_k: 0,
  };

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get(
      'ollamaAvailableModels',
    ) || [
      'deepseek-coder-v2',
      'llama3',
      'llama3:70b',
      'phi3',
      'phi3:medium',
      'gemma:2b',
      'gemma:7b',
      'mistral',
      'moondream',
      'neural-chat',
      'starling-lm',
      'codellama',
      'llama2-uncensored',
      'llava',
      'solar',
    ];
    const defaultModelName = availableModelNames[0];

    super(
      context,
      'ollamaConversationHistory.json',
      settingsManager,
      defaultModelName,
      availableModelNames,
    );

    this.clientHost = settingsManager.get('ollamaClientHost');

    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize Ollama Service History: ' + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration('repo-code-assistant.ollamaClientHost') ||
        e.affectsConfiguration('repo-code-assistant.ollamaAvailableModels')
      ) {
        this.clientHost = settingsManager.get('ollamaClientHost');
        this.availableModelNames = settingsManager.get(
          'ollamaAvailableModels',
        ) || [
          'deepseek-coder-v2',
          'llama3',
          'llama3:70b',
          'phi3',
          'phi3:medium',
          'gemma:2b',
          'gemma:7b',
          'mistral',
          'moondream',
          'neural-chat',
          'starling-lm',
          'codellama',
          'llama2-uncensored',
          'llava',
          'solar',
        ];
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistories();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to initialize Ollama Service: ' + error,
      );
    }
  }

  private async conversationHistoryToContent(
    entries: {
      [key: string]: ConversationEntry;
    },
    query: string,
    images?: string[],
  ): Promise<Message[]> {
    const result: Message[] = [];
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

    // Ollama Face's API requires the query message at the end of the history
    if (result.length > 0 && result[result.length - 1].role !== 'user') {
      const lastUserMessage: Message = {
        role: 'user',
        content: query,
      };

      if (images) {
        lastUserMessage.images = await Promise.all(
          images.map(async (imagePath) => {
            const imageBuffer = await fs.promises.readFile(imagePath);
            return imageBuffer.toString('base64');
          }),
        );
      }

      result.push(lastUserMessage);
    }

    return result;
  }

  public async getResponseForQuery(
    query: string,
    currentEntryID?: string,
  ): Promise<string> {
    const client = new Ollama({ host: this.clientHost });

    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;
    const conversationHistory = await this.conversationHistoryToContent(
      history.entries,
      query,
    );

    try {
      const response: ChatResponse = await client.chat({
        model: this.currentModel,
        messages: conversationHistory,
        options: this.generationConfig,
      });

      return response.message.content;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Ollama Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }

  public async getResponseChunksForQuery(
    query: string,
    sendStreamResponse: (msg: string) => void,
    currentEntryID?: string,
  ): Promise<string> {
    const client = new Ollama({ host: this.clientHost });

    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;
    const conversationHistory = await this.conversationHistoryToContent(
      history.entries,
      query,
    );

    try {
      const response = await client.chat({
        model: this.currentModel,
        messages: conversationHistory,
        stream: true,
        options: this.generationConfig,
      });

      let responseText = '';

      for await (const part of response) {
        const partText = part.message.content;
        sendStreamResponse(partText);
        responseText += partText;
      }

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Ollama Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }

  public async getResponseForQueryWithImage(
    query: string,
    images: string[],
    currentEntryID?: string,
  ): Promise<string> {
    const client = new Ollama({ host: this.clientHost });

    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;
    const conversationHistory = await this.conversationHistoryToContent(
      history.entries,
      query,
      images,
    );

    try {
      const response: ChatResponse = await client.chat({
        model: this.currentModel,
        messages: conversationHistory,
        options: this.generationConfig,
      });

      return response.message.content;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Ollama Service with image: ' + error,
      );
      return 'Failed to connect to the language model service with image.';
    }
  }

  public async getResponseChunksForQueryWithImage(
    query: string,
    images: string[],
    sendStreamResponse: (msg: string) => void,
    currentEntryID?: string,
  ): Promise<string> {
    const client = new Ollama({ host: this.clientHost });

    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;
    const conversationHistory = await this.conversationHistoryToContent(
      history.entries,
      query,
      images,
    );

    try {
      const response = await client.chat({
        model: this.currentModel,
        messages: conversationHistory,
        stream: true,
        options: this.generationConfig,
      });

      let responseText = '';

      for await (const part of response) {
        const partText = part.message.content;
        sendStreamResponse(partText);
        responseText += partText;
      }

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Ollama Service with image: ' + error,
      );
      return 'Failed to connect to the language model service with image.';
    }
  }
}
