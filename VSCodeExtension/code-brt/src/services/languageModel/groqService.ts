import * as vscode from 'vscode';

import type { ChatCompletionCreateParamsBase } from 'groq-sdk/resources/chat/completions';
import Groq from 'groq-sdk';

import {
  GetResponseOptions,
  NonStreamCompletionOpenaiLike,
  ResponseWithAction,
  StreamCompletionOpenaiLike,
} from './types';
import { AbstractOpenaiLikeService } from './base';
import { SettingsManager } from '../../api';

export class GroqService extends AbstractOpenaiLikeService {
  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get('groqAvailableModels');
    const defaultModelName = settingsManager.get('lastSelectedModel').groq;

    super(
      'groq',
      context,
      settingsManager,
      defaultModelName,
      availableModelNames,
    );
  }

  protected async handleGetNonStreamResponse(
    requestPayload: ChatCompletionCreateParamsBase,
  ): Promise<NonStreamCompletionOpenaiLike> {
    const groq = new Groq({
      apiKey: this.settingsManager.get('groqApiKey'),
    });
    return groq.chat.completions.create({
      ...requestPayload,
      stream: false,
    });
  }

  protected async handleGetStreamResponse(
    requestPayload: ChatCompletionCreateParamsBase,
  ): Promise<StreamCompletionOpenaiLike> {
    const groq = new Groq({
      apiKey: this.settingsManager.get('groqApiKey'),
    });
    return groq.chat.completions.create({
      ...requestPayload,
      stream: true,
    });
  }

  public async getLatestAvailableModelNames(): Promise<string[]> {
    const groq = new Groq({
      apiKey: this.settingsManager.get('groqApiKey'),
    });

    let newAvailableModelNames: string[] = [...this.availableModelNames];

    try {
      const latestModels = (await groq.models.list()).data.sort((a, b) =>
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
        if (model.id.includes('whisper')) return;

        newAvailableModelNames.push(model.id);
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to fetch available models: ' + error,
      );
    }

    return newAvailableModelNames;
  }

  public async getResponse(
    options: GetResponseOptions,
  ): Promise<ResponseWithAction> {
    if (this.currentModel === '') {
      vscode.window.showErrorMessage(
        'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
      );
      return {
        textResponse:
          'Missing model configuration. Check the model selection dropdown.',
      };
    }

    const {
      query,
      historyManager,
      images,
      currentEntryID,
      sendStreamResponse,
      updateStatus,
      selectedModelName,
      disableTools,
      toolCallResponse,
    } = options;

    if (images && images.length > 0) {
      vscode.window.showWarningMessage(
        'The images inference is not supported currently. The images will be ignored.',
      );
    }

    const conversationHistory = await this.conversationHistoryToContent(
      historyManager.getHistoryBeforeEntry(currentEntryID).entries,
      query,
      historyManager,
      undefined,
      toolCallResponse,
    );

    const { systemPrompt, generationConfig } =
      this.getAdvanceSettings(historyManager);

    if (systemPrompt) {
      conversationHistory.unshift({
        role: 'system',
        content: systemPrompt,
      });
    }

    updateStatus && updateStatus('');
    try {
      return await this.getResponseWithRetry(
        conversationHistory,
        selectedModelName,
        disableTools,
        generationConfig,
        sendStreamResponse,
        updateStatus,
      );
    } catch (error) {
      return this.handleGetResponseError(error, 'groq');
    } finally {
      this.stopStreamFlag = false;
      updateStatus && updateStatus('');
    }
  }

  public async stopResponse(): Promise<void> {
    this.stopStreamFlag = true;
  }
}
