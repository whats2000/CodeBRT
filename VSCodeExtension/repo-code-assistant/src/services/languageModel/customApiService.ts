import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import SettingsManager from '../../api/settingsManager';
import { ConversationEntry } from '../../types/conversationHistory';

export class CustomApiService extends AbstractLanguageModelService {
  private apiUrl: string;
  private apiMethod: 'GET' | 'POST';
  private apiTextParam: string;
  private apiImageParam: string;
  private includeQueryInHistory: boolean;
  private readonly settingsListener: vscode.Disposable;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    availableModelName: string[],
  ) {
    const selectedModel = settingsManager.getSelectedCustomModel();
    if (selectedModel) {
      super(
        context,
        'customApiConversationHistory.json',
        settingsManager,
        selectedModel.name,
        availableModelName,
      );
      this.apiUrl = selectedModel.apiUrl;
      this.apiMethod = selectedModel.apiMethod;
      this.apiTextParam = selectedModel.apiTextParam;
      this.apiImageParam = selectedModel.apiImageParam;
      this.includeQueryInHistory = selectedModel.includeQueryInHistory;
    } else {
      super(
        context,
        'customApiConversationHistory.json',
        settingsManager,
        'custom',
        availableModelName,
      );
      this.apiUrl = '';
      this.apiMethod = 'POST';
      this.apiTextParam = 'message';
      this.apiImageParam = 'images';
      this.includeQueryInHistory = true;
      console.log(
        'No custom model configuration found. Please configure a custom model.',
      );
    }

    // Initialize and load conversation history
    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize Custom API Service: ' + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration('repo-code-assistant.customModels') ||
        e.affectsConfiguration('repo-code-assistant.selectedCustomModel')
      ) {
        this.updateSettings();
      }
    });

    context.subscriptions.push(this.settingsListener);
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

  private updateSettings() {
    const selectedModel = this.settingsManager.getSelectedCustomModel();
    if (selectedModel) {
      this.apiUrl = selectedModel.apiUrl;
      this.apiMethod = selectedModel.apiMethod;
      this.apiTextParam = selectedModel.apiTextParam;
      this.apiImageParam = selectedModel.apiImageParam;
      this.includeQueryInHistory = selectedModel.includeQueryInHistory;
    } else {
      this.apiUrl = '';
      this.apiMethod = 'POST';
      this.apiTextParam = 'message';
      this.apiImageParam = 'images';
      this.includeQueryInHistory = true;
      vscode.window
        .showErrorMessage(
          'No custom model configuration found. Please configure a custom model.',
        )
        .then();
    }
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
      !this.includeQueryInHistory &&
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
  ): Promise<FormData> {
    const formData = new FormData();
    formData.append(this.apiTextParam, conversationHistory);

    for (const [index, image] of images.entries()) {
      const mimeType = `image/${path.extname(image).slice(1)}`;
      const file = await fs.promises.readFile(image);
      formData.append(`${this.apiImageParam}[${index}]`, file, {
        filename: path.basename(image),
        contentType: mimeType,
      });
    }

    return formData;
  }

  public async getResponseForQuery(
    query: string,
    currentEntryID?: string,
  ): Promise<string> {
    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;
    const conversationHistory = this.conversationHistoryToJson(
      history.entries,
    ).replace('{query}', query);

    try {
      let response;
      if (this.apiMethod === 'GET') {
        response = await axios.get(this.apiUrl, {
          params: { [this.apiTextParam]: conversationHistory },
        });
      } else {
        response = await axios.post(this.apiUrl, {
          [this.apiTextParam]: conversationHistory,
        });
      }

      return response.data.response;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Custom API Service: ' + error,
      );
      return 'Failed to connect to the custom API service.';
    }
  }

  public async getResponseChunksForQuery(
    query: string,
    sendStreamResponse: (msg: string) => void,
    currentEntryID?: string,
  ): Promise<string> {
    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;
    const conversationHistory = this.conversationHistoryToJson(
      history.entries,
    ).replace('{query}', query);

    try {
      let responseText = '';
      const response =
        this.apiMethod === 'GET'
          ? await axios.get(this.apiUrl, {
              params: { [this.apiTextParam]: conversationHistory },
              responseType: 'stream',
            })
          : await axios.post(
              this.apiUrl,
              { [this.apiTextParam]: conversationHistory },
              { responseType: 'stream' },
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

  public async getResponseForQueryWithImage(
    query: string,
    images: string[],
    currentEntryID?: string,
  ): Promise<string> {
    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;
    const conversationHistory = this.conversationHistoryToJson(
      history.entries,
    ).replace('{query}', query);

    try {
      const formData = await this.createImageFormData(
        conversationHistory,
        images,
      );

      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      return response.data.response;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Custom API Service: ' + error,
      );
      return 'Failed to connect to the custom API service.';
    }
  }

  public async getResponseChunksForQueryWithImage(
    query: string,
    images: string[],
    sendStreamResponse: (msg: string) => void,
    currentEntryID?: string,
  ): Promise<string> {
    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;
    const conversationHistory = this.conversationHistoryToJson(
      history.entries,
    ).replace('{query}', query);

    try {
      const formData = await this.createImageFormData(
        conversationHistory,
        images,
      );

      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: 'stream',
      });

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
            'Failed to get response from Custom API Service with image: ' +
              error,
          );
          reject('Failed to connect to the custom API service with image.');
        });
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Custom API Service with image: ' + error,
      );
      return 'Failed to connect to the custom API service with image.';
    }
  }

  public async switchModel(modelName: string): Promise<void> {
    const customModels = this.settingsManager.getCustomModels();
    const selectedModel = customModels.find(
      (model) => model.name === modelName,
    );

    if (!selectedModel) {
      vscode.window.showErrorMessage(`Custom model ${modelName} not found.`);
      return;
    }
    this.settingsManager.selectCustomModel(modelName);
    this.apiUrl = selectedModel.apiUrl;
    this.apiMethod = selectedModel.apiMethod;
    this.apiTextParam = selectedModel.apiTextParam;
    this.apiImageParam = selectedModel.apiImageParam;
    this.includeQueryInHistory = selectedModel.includeQueryInHistory;
    await this.loadHistories();

    super.switchModel(modelName);
  }
}
