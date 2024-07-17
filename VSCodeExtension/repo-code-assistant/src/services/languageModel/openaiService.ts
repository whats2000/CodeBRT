import * as vscode from 'vscode';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import {
  ChatCompletionMessageParam,
  ChatCompletionContentPartImage,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionCreateParamsNonStreaming,
} from 'openai/resources';

import type { ConversationEntry } from '../../types';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import SettingsManager from '../../api/settingsManager';

export class OpenAIService extends AbstractLanguageModelService {
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get('openaiAvailableModels');
    const defaultModelName = availableModelNames[0] || '';

    super(
      context,
      'openAIConversationHistory.json',
      settingsManager,
      defaultModelName,
      availableModelNames,
    );
    this.apiKey = settingsManager.get('openaiApiKey');

    // Initialize and load conversation history
    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize OpenAI Service: ' + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('repo-code-assistant.openaiApiKey')) {
        this.apiKey = settingsManager.get('openaiApiKey');
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
    const result: ChatCompletionMessageParam[] = [];
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
  ): ChatCompletionContentPartImage | undefined {
    try {
      const base64Data = fs.readFileSync(filePath).toString('base64');
      return {
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${base64Data}`,
        },
      };
    } catch (error) {
      console.error('Failed to read image file:', error);
    }
  }

  public async getLatestAvailableModelNames(): Promise<string[]> {
    const openai = new OpenAI({
      apiKey: this.apiKey,
    });

    let newAvailableModelNames: string[] = [...this.availableModelNames];

    try {
      const latestModels = (await openai.models.list()).data.sort((a, b) =>
        a.created > b.created ? -1 : 1,
      );

      // Filter the invalid models (Not existing in the latest models)
      newAvailableModelNames = newAvailableModelNames.filter((name) =>
        latestModels.some((model) => model.id === name),
      );

      // Append the models to the available models if they are not already there
      latestModels.forEach((model) => {
        if (!model.id) return;
        if (newAvailableModelNames.includes(model.id)) return;
        if (!model.id.includes('gpt')) return;

        newAvailableModelNames.push(model.id);
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
    if (this.currentModel === '') {
      vscode.window.showErrorMessage(
        'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
      );
      return 'Missing model configuration. Check the model selection dropdown.';
    }

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
    if (this.currentModel === '') {
      vscode.window.showErrorMessage(
        'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
      );
      return 'Missing model configuration. Check the model selection dropdown.';
    }

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
    if (this.currentModel === '') {
      vscode.window.showErrorMessage(
        'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
      );
      return 'Missing model configuration. Check the model selection dropdown.';
    }

    const openai = new OpenAI({ apiKey: this.apiKey });

    try {
      const imageParts = images
        .map((image) => {
          const mimeType = `image/${path.extname(image).slice(1)}`;
          return this.fileToGenerativePart(image, mimeType);
        })
        .filter(
          (part) => part !== undefined,
        ) as ChatCompletionContentPartImage[];

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
    if (this.currentModel === '') {
      vscode.window.showErrorMessage(
        'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
      );
      return 'Missing model configuration. Check the model selection dropdown.';
    }

    const openai = new OpenAI({ apiKey: this.apiKey });

    try {
      let responseText = '';

      const imageParts = images
        .map((image) => {
          const mimeType = `image/${path.extname(image).slice(1)}`;
          return this.fileToGenerativePart(image, mimeType);
        })
        .filter(
          (part) => part !== undefined,
        ) as ChatCompletionContentPartImage[];

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
