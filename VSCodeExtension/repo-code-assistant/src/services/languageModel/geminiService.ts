import * as vscode from 'vscode';
import fs from 'fs';
import {
  Content,
  GenerativeModel,
  InlineDataPart,
} from '@google/generative-ai';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai';

import type { ConversationEntry, GetResponseOptions } from '../../types';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import { SettingsManager } from '../../api';

type GeminiModel = {
  name: string;
  baseModelId: string;
  version: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
  temperature: number;
  topP: number;
  topK: number;
};

type GeminiModelsList = {
  models: GeminiModel[];
};

export class GeminiService extends AbstractLanguageModelService {
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  private readonly generationConfig = {
    temperature: 1,
    topK: 0,
    topP: 0.95,
    maxOutputTokens: 8192,
  };

  private readonly safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get('geminiAvailableModels');
    const defaultModelName = settingsManager.get('lastSelectedModel').gemini;

    super(
      'gemini',
      context,
      'geminiConversationHistory.json',
      settingsManager,
      defaultModelName,
      availableModelNames,
    );
    this.apiKey = settingsManager.get('geminiApiKey');

    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize Gemini Service: ' + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('repo-code-assistant.geminiApiKey')) {
        this.apiKey = settingsManager.get('geminiApiKey');
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistories();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to initialize Gemini Service History: ' + error,
      );
    }
  }

  private conversationHistoryToContent(entries: {
    [key: string]: ConversationEntry;
  }): Content[] {
    let result: Content[] = [];
    let currentEntry = entries[this.history.current];

    while (currentEntry) {
      result.unshift({
        role: currentEntry.role === 'AI' ? 'model' : 'user',
        parts: [{ text: currentEntry.message }],
      });

      if (currentEntry.parent) {
        currentEntry = entries[currentEntry.parent];
      } else {
        break;
      }
    }

    // Gemini's history doesn't include the query message
    if (result.length > 0 && result[result.length - 1].role === 'user') {
      result.pop();
    }

    return result;
  }

  private fileToGenerativePart(path: string, mimeType: string): InlineDataPart {
    return {
      inlineData: {
        data: Buffer.from(fs.readFileSync(path)).toString('base64'),
        mimeType,
      },
    };
  }

  public async getLatestAvailableModelNames(): Promise<string[]> {
    const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`;

    let newAvailableModelNames: string[] = [...this.availableModelNames];

    try {
      const response = await fetch(requestUrl);

      if (!response.ok) {
        vscode.window.showErrorMessage(
          'Failed to fetch available models from Gemini Service: ' +
            response.statusText,
        );
        return this.availableModelNames;
      }

      const data: GeminiModelsList = await response.json();
      const latestModels = data.models || [];

      // Filter the invalid models (Not existing in the latest models)
      newAvailableModelNames = newAvailableModelNames.filter((name) =>
        latestModels.some((model) => model.name === `models/${name}`),
      );

      // Append the models to the available models if they are not already there
      latestModels.forEach((model) => {
        if (!model.name || !model.supportedGenerationMethods) return;
        if (newAvailableModelNames.includes(model.name.replace('models/', '')))
          return;
        if (!model.supportedGenerationMethods.includes('generateContent'))
          return;

        newAvailableModelNames.push(model.name.replace('models/', ''));
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to fetch available models: ' + error,
      );
    }

    return newAvailableModelNames;
  }

  private async getResponseChunksWithTextPayload(
    generativeModel: GenerativeModel,
    query: string,
    conversationHistory: Content[],
    sendStreamResponse?: (message: string) => void,
  ): Promise<string> {
    try {
      if (!sendStreamResponse) {
        return (
          await generativeModel
            .startChat({
              generationConfig: this.generationConfig,
              safetySettings: this.safetySettings,
              history: conversationHistory,
            })
            .sendMessage(query)
        ).response.text();
      }

      const chat = generativeModel.startChat({
        generationConfig: this.generationConfig,
        safetySettings: this.safetySettings,
        history: conversationHistory,
      });

      let responseText = '';
      const result = await chat.sendMessageStream(query);
      for await (const item of result.stream) {
        const partText = item.text();
        sendStreamResponse(partText);
        responseText += partText;
      }

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Gemini Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }

  private async getResponseChunksWithImagePayload(
    generativeModel: GenerativeModel,
    query: string,
    images: string[],
    _conversationHistory: Content[],
    sendStreamResponse?: (message: string) => void,
  ): Promise<string> {
    try {
      const imageParts = images.map((image) => {
        return this.fileToGenerativePart(
          image,
          `image/${image.split('.').pop()}`,
        );
      });

      if (!sendStreamResponse) {
        const result = await generativeModel.generateContent({
          generationConfig: this.generationConfig,
          contents: [{ role: 'user', parts: [{ text: query }, ...imageParts] }],
        });

        return result.response.text();
      }

      let responseText = '';
      const result = await generativeModel.generateContentStream({
        generationConfig: this.generationConfig,
        contents: [{ role: 'user', parts: [{ text: query }, ...imageParts] }],
      });

      for await (const item of result.stream) {
        const partText = item.text();
        sendStreamResponse(partText);
        responseText += partText;
      }

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Gemini Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }

  public async getResponse(options: GetResponseOptions): Promise<string> {
    if (this.currentModel === '') {
      vscode.window.showErrorMessage(
        'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
      );
      return 'Missing model configuration. Check the model selection dropdown.';
    }

    const { query, images, sendStreamResponse, currentEntryID } = options;

    const generativeModel = new GoogleGenerativeAI(
      this.apiKey,
    ).getGenerativeModel({
      model: this.currentModel,
    });

    const conversationHistory = this.conversationHistoryToContent(
      this.getHistoryBeforeEntry(currentEntryID).entries,
    );

    if (images && images.length > 0) {
      return this.getResponseChunksWithImagePayload(
        generativeModel,
        query,
        images,
        conversationHistory,
        sendStreamResponse,
      );
    }

    return this.getResponseChunksWithTextPayload(
      generativeModel,
      query,
      conversationHistory,
      sendStreamResponse,
    );
  }
}
