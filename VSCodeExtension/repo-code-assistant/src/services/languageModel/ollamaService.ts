import * as vscode from 'vscode';
import fs from 'fs';
import type { Message, Options } from 'ollama';
import { Ollama } from 'ollama';

import type { ConversationEntry, GetResponseOptions } from '../../types';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import { SettingsManager } from '../../api';

type OllamaRunningModel = {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  expires_at: string;
  size_vram: number;
};

export class OllamaService extends AbstractLanguageModelService {
  private readonly generationConfig: Partial<Options> = {
    temperature: 1,
    top_p: 0.95,
    top_k: 0,
  };

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get('ollamaAvailableModels');
    const defaultModelName = settingsManager.get('lastSelectedModel').ollama;

    super(
      'ollama',
      context,
      'ollamaConversationHistory.json',
      settingsManager,
      defaultModelName,
      availableModelNames,
    );

    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize Ollama Service History: ' + error,
      ),
    );
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

    // Ollama's API requires the query message at the end of the history
    if (result.length > 0 && result[result.length - 1].role !== 'user') {
      result.push({
        role: 'user',
        content: query,
      });
    }

    if (images) {
      result[result.length - 1].images = await Promise.all(
        images
          .map(async (imagePath) => {
            try {
              const imageBuffer = await fs.promises.readFile(imagePath);
              return imageBuffer.toString('base64');
            } catch (error) {
              console.error('Failed to read image file:', error);
            }
          })
          .filter((image) => image !== undefined) as Promise<string>[],
      );
    }

    return result;
  }

  private async getRunningModel(): Promise<string> {
    const requestUrl = `${this.settingsManager.get('ollamaClientHost')}/api/ps`;

    try {
      const runningModels: OllamaRunningModel[] = (
        await fetch(requestUrl).then((res) => res.json())
      ).models;

      if (runningModels.length === 0) {
        vscode.window.showErrorMessage('No running models found.');
        return '';
      }

      return runningModels[0].name;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get running model from Ollama Service: ' + error,
      );
      return '';
    }
  }

  private async initModel(
    query: string,
    currentEntryID?: string,
    images?: string[],
  ): Promise<{
    client: Ollama;
    conversationHistory: Message[];
    model: string;
  }> {
    const client = new Ollama({
      host: this.settingsManager.get('ollamaClientHost'),
    });

    const conversationHistory = await this.conversationHistoryToContent(
      this.getHistoryBeforeEntry(currentEntryID).entries,
      query,
      images,
    );

    const model =
      this.currentModel === 'Auto Detect'
        ? await this.getRunningModel()
        : this.currentModel;

    return { client, conversationHistory, model };
  }

  public async getLatestAvailableModelNames(): Promise<string[]> {
    const client = new Ollama({
      host: this.settingsManager.get('ollamaClientHost'),
    });

    let newAvailableModelNames: string[] = [...this.availableModelNames];

    try {
      const latestModels = (await client.list()).models.sort((a, b) =>
        a.modified_at > b.modified_at ? -1 : 1,
      );

      // Filter the invalid models (Not existing in the latest models)
      newAvailableModelNames = newAvailableModelNames.filter((name) =>
        latestModels.some((model) => model.name === name),
      );

      // Append the models to the available models if they are not already there
      latestModels.forEach((model) => {
        if (newAvailableModelNames.includes(model.name)) return;

        newAvailableModelNames.push(model.name);
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to fetch available models, make sure the ollama service is running: ' +
          error,
      );
    }

    if (!newAvailableModelNames.includes('Auto Detect')) {
      newAvailableModelNames = ['Auto Detect', ...newAvailableModelNames];
    }

    return newAvailableModelNames;
  }

  public async getResponse(options: GetResponseOptions): Promise<string> {
    if (this.currentModel === '') {
      vscode.window.showErrorMessage(
        'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
      );
      return 'Missing model configuration. Check the model selection dropdown.';
    }

    const { query, images, sendStreamResponse, currentEntryID } = options;

    const { client, conversationHistory, model } = await this.initModel(
      query,
      currentEntryID,
      images,
    );

    if (model === '') {
      return 'The ollama is seems to be down. Please start the ollama service.';
    }

    try {
      if (!sendStreamResponse) {
        return (
          await client.chat({
            model,
            messages: conversationHistory,
            options: this.generationConfig,
          })
        ).message.content;
      }

      const response = await client.chat({
        model,
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
      return (
        'Failed to connect to the language model service. ' +
        'Make sure the ollama service is running. Also, check the model has been downloaded.'
      );
    }
  }
}
