import * as vscode from 'vscode';
import type { ChatMessage } from 'cohere-ai/api';
import { CohereClient } from 'cohere-ai';

import type { ConversationEntry } from '../../types';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import SettingsManager from '../../api/settingsManager';

export class CohereService extends AbstractLanguageModelService {
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get(
      'cohereAvailableModels',
    ) || ['command'];
    const defaultModelName = availableModelNames[0];

    super(
      context,
      'cohereConversationHistory.json',
      settingsManager,
      defaultModelName,
      availableModelNames,
    );

    this.apiKey = settingsManager.get('cohereApiKey');

    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize Cohere Service History: ' + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration('repo-code-assistant.cohereApiKey') ||
        e.affectsConfiguration('repo-code-assistant.cohereAvailableModels')
      ) {
        this.apiKey = settingsManager.get('cohereApiKey');
        this.availableModelNames = settingsManager.get(
          'cohereAvailableModels',
        ) || ['command'];
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistories();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to initialize Cohere Service: ' + error,
      );
    }
  }

  private conversationHistoryToContent(entries: {
    [key: string]: ConversationEntry;
  }): ChatMessage[] {
    let result: ChatMessage[] = [];
    let currentEntry = entries[this.history.current];

    while (currentEntry) {
      result.unshift({
        role: currentEntry.role === 'AI' ? 'CHATBOT' : 'USER',
        message: currentEntry.message,
      });

      if (currentEntry.parent) {
        currentEntry = entries[currentEntry.parent];
      } else {
        break;
      }
    }

    // Cohere's API doesn't include the query message
    if (result.length > 0 && result[result.length - 1].role === 'USER') {
      result.pop();
    }

    return result;
  }

  public async getResponseForQuery(
    query: string,
    currentEntryID?: string,
  ): Promise<string> {
    const model = new CohereClient({ token: this.apiKey });

    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;

    const conversationHistory = this.conversationHistoryToContent(
      history.entries,
    );

    try {
      const response = await model.chat({
        chatHistory: conversationHistory,
        model: this.currentModel,
        message: query,
      });

      return response.text;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Cohere Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }

  public async getResponseChunksForQuery(
    query: string,
    sendStreamResponse: (msg: string) => void,
    currentEntryID?: string,
  ): Promise<string> {
    const model = new CohereClient({
      token: this.apiKey,
    });

    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;

    const conversationHistory = this.conversationHistoryToContent(
      history.entries,
    );

    try {
      const result = await model.chatStream({
        chatHistory: conversationHistory,
        model: this.currentModel,
        message: query,
      });
      let responseText = '';
      for await (const item of result) {
        if (item.eventType !== 'text-generation') continue;

        const partText = item.text;
        sendStreamResponse(partText);
        responseText += partText;
      }

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Cohere Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }
}
