import * as vscode from 'vscode';
import type {
  ChatCompletionInput,
  ChatCompletionInputMessage,
} from '@huggingface/tasks/src/tasks/chat-completion/inference';
import { HfInference } from '@huggingface/inference';

import type { ConversationEntry, GetResponseOptions } from '../../types';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import { SettingsManager } from '../../api';

export class HuggingFaceService extends AbstractLanguageModelService {
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  private readonly generationConfig: Partial<ChatCompletionInput> = {
    max_tokens: 8192,
  };

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get(
      'huggingFaceAvailableModels',
    );
    const defaultModelName =
      settingsManager.get('lastSelectedModel').huggingFace;

    super(
      'huggingFace',
      context,
      'huggingFaceConversationHistory.json',
      settingsManager,
      defaultModelName,
      availableModelNames,
    );

    this.apiKey = settingsManager.get('huggingFaceApiKey');

    // Initialize and load conversation history
    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize Hugging Face Service: ' + error,
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
    entries: { [key: string]: ConversationEntry },
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

  public async getResponse(options: GetResponseOptions): Promise<string> {
    if (this.currentModel === '') {
      vscode.window.showErrorMessage(
        'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
      );
      return 'Missing model configuration. Check the model selection dropdown.';
    }

    const { query, images, sendStreamResponse, currentEntryID } = options;

    if (images && images.length > 0) {
      vscode.window.showWarningMessage(
        'The images inference is not supported currently. The images will be ignored.',
      );
    }

    const huggerFace = new HfInference(this.apiKey);

    const conversationHistory = this.conversationHistoryToContent(
      this.getHistoryBeforeEntry(currentEntryID).entries,
      query,
    );

    try {
      if (!sendStreamResponse) {
        return (
          await huggerFace.chatCompletion({
            model: this.currentModel,
            messages: conversationHistory,
            ...this.generationConfig,
          })
        ).choices[0].message.content!;
      }

      let responseText = '';

      for await (const chunk of huggerFace.chatCompletionStream({
        model: this.currentModel,
        messages: conversationHistory,
        ...this.generationConfig,
      })) {
        const responseChunk = chunk.choices[0].delta.content ?? '';
        sendStreamResponse(responseChunk);
        responseText += responseChunk;
      }

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Hugging Face Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }
}
