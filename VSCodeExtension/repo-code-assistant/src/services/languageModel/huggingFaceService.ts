import * as vscode from 'vscode';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import SettingsManager from '../../api/settingsManager';
import { ConversationEntry } from '../../types/conversationHistory';
import { HfInference } from '@huggingface/inference';
import { ChatCompletionInputMessage } from '@huggingface/tasks/src/tasks/chat-completion/inference';

export class HuggingFaceService extends AbstractLanguageModelService {
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    availableModelName: string[] = ['HuggingFaceH4/zephyr-7b-beta'],
  ) {
    super(
      context,
      'huggingFaceConversationHistory.json',
      settingsManager,
      availableModelName[0],
      availableModelName,
    );

    this.apiKey = settingsManager.get('huggingFaceApiKey');

    // Initialize and load conversation history
    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize OpenAI Service: ' + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('repo-code-assistant.huggingFaceApiKey')) {
        this.apiKey = settingsManager.get('huggingFaceApiKey');
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistories();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to initialize Hugging Face Service: ' + error,
      );
    }
  }

  private conversationHistoryToContent(
    entries: { [key: string]: ConversationEntry; },
    query: string,
  ): ChatCompletionInputMessage[] {
    const result: ChatCompletionInputMessage[] = [];
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

    // Hugging Face's API requires the query message at the end of the history
    if (result.length > 0 && result[result.length - 1].role !== 'user') {
      result.push({
        role: 'user',
        content: query,
      });
    }

    return result;
  }

  public async getResponseForQuery(
    query: string,
    currentEntryID?: string,
  ): Promise<string> {
    const huggerFace = new HfInference(this.apiKey);

    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;
    const conversationHistory = this.conversationHistoryToContent(
      history.entries,
      query,
    );

    const response = await huggerFace.chatCompletion({
      model: this.currentModel,
      messages: conversationHistory,
      max_tokens: 8192,
    });

    return response.choices[0].message.content ?? '';
  }

  public async getResponseChunksForQuery(
    query: string,
    sendStreamResponse: (msg: string) => void,
    currentEntryID?: string,
  ): Promise<string> {
    const huggerFace = new HfInference(this.apiKey);

    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;
    const conversationHistory = this.conversationHistoryToContent(
      history.entries,
      query,
    );

    let responseText = '';

    for await (const chunk of huggerFace.chatCompletionStream({
      model: this.currentModel,
      messages: conversationHistory,
      max_tokens: 8192,
    })) {
      const responseChunk = chunk.choices[0].delta.content ?? '';
      sendStreamResponse(responseChunk);
      responseText += responseChunk;
    }

    return responseText;
  }
}
