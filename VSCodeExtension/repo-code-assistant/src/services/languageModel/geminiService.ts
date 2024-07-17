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

import type { ConversationEntry } from '../../types';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import SettingsManager from '../../api/settingsManager';

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
    const defaultModelName = availableModelNames[0] || '';

    super(
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

  private initModel(currentEntryID?: string): {
    generativeModel: GenerativeModel;
    conversationHistory: Content[];
    errorMessage?: string;
  } {
    const generativeModel = new GoogleGenerativeAI(
      this.apiKey,
    ).getGenerativeModel({
      model: this.currentModel,
    });

    if (this.currentModel === '') {
      vscode.window
        .showErrorMessage(
          'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
        )
        .then();
      return {
        generativeModel,
        conversationHistory: [],
        errorMessage:
          'Missing model configuration. Check the model selection dropdown.',
      };
    }

    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;
    const conversationHistory = this.conversationHistoryToContent(
      history.entries,
    );

    return {
      generativeModel,
      conversationHistory,
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

  public async getResponseForQuery(
    query: string,
    currentEntryID?: string,
  ): Promise<string> {
    const { generativeModel, conversationHistory, errorMessage } =
      this.initModel(currentEntryID);

    if (errorMessage) {
      return errorMessage;
    }

    try {
      const chat = generativeModel.startChat({
        generationConfig: this.generationConfig,
        safetySettings: this.safetySettings,
        history: conversationHistory,
      });

      const result = await chat.sendMessage(query);
      return result.response.text();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Gemini Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }

  public async getResponseChunksForQuery(
    query: string,
    sendStreamResponse: (msg: string) => void,
    currentEntryID?: string,
  ): Promise<string> {
    const { generativeModel, conversationHistory, errorMessage } =
      this.initModel(currentEntryID);

    if (errorMessage) {
      return errorMessage;
    }

    try {
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

  public async getResponseForQueryWithImage(
    query: string,
    images: string[],
  ): Promise<string> {
    if (this.currentModel === '') {
      vscode.window.showErrorMessage(
        'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
      );
      return 'Missing model configuration. Check the model selection dropdown.';
    }

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: this.currentModel });

    try {
      const imageParts = images.map((image) => {
        return this.fileToGenerativePart(
          image,
          `image/${image.split('.').pop()}`,
        );
      });

      const result = await model.generateContent({
        generationConfig: this.generationConfig,
        contents: [{ role: 'user', parts: [{ text: query }, ...imageParts] }],
      });

      return result.response.text();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Gemini Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }

  public async getResponseChunksForQueryWithImage(
    query: string,
    images: string[],
    sendStreamResponse: (msg: string) => void,
  ): Promise<string> {
    if (this.currentModel === '') {
      vscode.window.showErrorMessage(
        'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
      );
      return 'Missing model configuration. Check the model selection dropdown.';
    }
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: this.currentModel });

    try {
      let responseText = '';

      const imageParts = images.map((image) => {
        return this.fileToGenerativePart(
          image,
          `image/${image.split('.').pop()}`,
        );
      });

      const result = await model.generateContentStream({
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
}
