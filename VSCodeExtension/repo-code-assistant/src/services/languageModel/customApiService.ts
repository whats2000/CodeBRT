import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';

import {
  ConversationEntry,
  CustomModelSettings,
  GetResponseOptions,
} from '../../types';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import { SettingsManager } from '../../api';

export class CustomApiService extends AbstractLanguageModelService {
  private readonly defaultCustomModelSettings: CustomModelSettings = {
    id: '',
    name: '',
    apiUrl: '',
    apiMethod: 'POST',
    apiTextParam: 'message',
    apiImageParam: 'images',
    apiQueryParam: 'query',
    includeQueryInHistory: true,
  };
  private selectedCustomModelSettings: CustomModelSettings =
    this.defaultCustomModelSettings;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager
      .get('customModels')
      .map((customModel) => customModel.name);

    const selectedModelName = settingsManager.get('lastSelectedModel').custom;
    const selectedModel = settingsManager
      .get('customModels')
      .find((model) => model.name === selectedModelName);

    super(
      'custom',
      context,
      'customApiConversationHistory.json',
      settingsManager,
      selectedModel?.name || 'not set',
      availableModelNames,
    );

    this.updateSettings(selectedModel);

    // Initialize and load conversation history
    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize Custom API Service: ' + error,
      ),
    );
  }

  private async initialize() {
    try {
      await this.loadHistories();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to initialize Custom API Service: ' + error,
      );
    }
  }

  private updateSettings(selectedModel: CustomModelSettings | undefined) {
    this.selectedCustomModelSettings =
      selectedModel || this.defaultCustomModelSettings;
  }

  private conversationHistoryToJson(entries: {
    [key: string]: ConversationEntry;
  }): string {
    const historyArray = [];
    let currentEntry = entries[this.history.current];

    while (currentEntry) {
      historyArray.unshift({
        role: currentEntry.role,
        message: currentEntry.message,
      });
      if (currentEntry.parent) {
        currentEntry = entries[currentEntry.parent];
      } else {
        break;
      }
    }

    // If the API format history doesn't include the query message and the last message is a user message, remove it
    if (
      !this.selectedCustomModelSettings.includeQueryInHistory &&
      historyArray.length > 0 &&
      historyArray[historyArray.length - 1].role === 'user'
    ) {
      historyArray.pop();
    }

    return JSON.stringify(historyArray);
  }

  private async createImageFormData(
    conversationHistory: string,
    images: string[],
    query: string,
  ): Promise<FormData> {
    const formData = new FormData();
    formData.append(
      this.selectedCustomModelSettings.apiTextParam,
      conversationHistory,
    );

    if (!this.selectedCustomModelSettings.includeQueryInHistory) {
      formData.append(this.selectedCustomModelSettings.apiQueryParam, query);
    }

    for (const [index, image] of images.entries()) {
      try {
        const mimeType = `image/${path.extname(image).slice(1)}`;
        const file = await fs.promises.readFile(image);
        formData.append(
          `${this.selectedCustomModelSettings.apiImageParam}[${index}]`,
          file,
          {
            filename: path.basename(image),
            contentType: mimeType,
          },
        );
      } catch (error) {
        console.error('Failed to read image file:', error);
      }
    }

    return formData;
  }

  private async getResponseChunksWithTextPayload(
    query: string,
    conversationHistory: string,
    sendStreamResponse?: (message: string) => void,
  ): Promise<string> {
    const requestPayload: any = {
      [this.selectedCustomModelSettings.apiTextParam]: conversationHistory,
    };

    if (!this.selectedCustomModelSettings.includeQueryInHistory) {
      requestPayload[this.selectedCustomModelSettings.apiQueryParam] = query;
    }

    try {
      if (!sendStreamResponse) {
        return (
          this.selectedCustomModelSettings.apiMethod === 'GET'
            ? await axios.get(this.selectedCustomModelSettings.apiUrl, {
                params: requestPayload,
              })
            : await axios.post(
                this.selectedCustomModelSettings.apiUrl,
                requestPayload,
              )
        ).data.response;
      }

      let responseText = '';
      const response =
        this.selectedCustomModelSettings.apiMethod === 'GET'
          ? await axios.get(this.selectedCustomModelSettings.apiUrl, {
              params: requestPayload,
              responseType: 'stream',
            })
          : await axios.post(
              this.selectedCustomModelSettings.apiUrl,
              requestPayload,
              {
                responseType: 'stream',
              },
            );

      return new Promise<string>((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          const partText = chunk.toString();
          sendStreamResponse(partText);
          responseText += partText;
        });

        response.data.on('end', () => {
          resolve(responseText);
        });

        response.data.on('error', (error: Error) => {
          vscode.window.showErrorMessage(
            'Failed to get response from Custom API Service: ' + error,
          );
          reject('Failed to connect to the custom API service.');
        });
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Custom API Service: ' + error,
      );
      return 'Failed to connect to the custom API service.';
    }
  }

  private async getResponseChunksWithImagePayload(
    query: string,
    images: string[],
    conversationHistory: string,
    sendStreamResponse?: (message: string) => void,
  ): Promise<string> {
    const formData = await this.createImageFormData(
      conversationHistory,
      images,
      query,
    );

    if (!sendStreamResponse) {
      const response = await axios.post(
        this.selectedCustomModelSettings.apiUrl,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        },
      );

      return response.data.response;
    }

    const response = await axios.post(
      this.selectedCustomModelSettings.apiUrl,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: 'stream',
      },
    );

    return new Promise<string>((resolve, reject) => {
      let responseText = '';

      response.data.on('data', (chunk: Buffer) => {
        const partText = chunk.toString();
        sendStreamResponse(partText);
        responseText += partText;
      });

      response.data.on('end', () => {
        resolve(responseText);
      });

      response.data.on('error', (error: Error) => {
        vscode.window.showErrorMessage(
          'Failed to get response from Custom API Service with image: ' + error,
        );
        reject('Failed to connect to the custom API service with image.');
      });
    });
  }

  public async getResponse(options: GetResponseOptions): Promise<string> {
    if (this.currentModel === '') {
      vscode.window.showErrorMessage(
        'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
      );
      return 'Missing model configuration. Check the model selection dropdown.';
    }

    const { query, images, sendStreamResponse, currentEntryID } = options;

    const canSendWithImages =
      this.selectedCustomModelSettings.apiMethod === 'GET' &&
      images &&
      images.length > 0;

    if (canSendWithImages) {
      vscode.window.showWarningMessage(
        'This API uses GET method currently and cannot be used with image uploads.',
      );
    }

    const conversationHistory = this.conversationHistoryToJson(
      this.getHistoryBeforeEntry(currentEntryID).entries,
    );

    try {
      if (canSendWithImages) {
        return this.getResponseChunksWithImagePayload(
          query,
          images,
          conversationHistory,
          sendStreamResponse,
        );
      }

      return this.getResponseChunksWithTextPayload(
        query,
        conversationHistory,
        sendStreamResponse,
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to get response from Custom API Service ${
          images && images.length > 0 ? 'with image' : ''
        }: ${error}`,
      );
      return `Failed to get response from Custom API Service ${images && images.length > 0 ? 'with image' : ''}: ${error}`;
    }
  }

  public async switchModel(modelName: string): Promise<void> {
    const customModels = this.settingsManager.get('customModels');
    const selectedModel = customModels.find(
      (model) => model.name === modelName,
    );

    if (!selectedModel) {
      vscode.window.showErrorMessage(`Custom model ${modelName} not found.`);
      return;
    }
    this.updateSettings(selectedModel);
    super.switchModel(modelName);
  }
}
