import * as vscode from 'vscode';
import type { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';
import OpenAI from 'openai';

import {
  GetResponseOptions,
  NonStreamCompletionOpenaiLike,
  ResponseWithAction,
  StreamCompletionOpenaiLike,
} from './types';
import { SettingsManager } from '../../api';
import { AbstractOpenaiLikeService } from './base';

export class OpenAIService extends AbstractOpenaiLikeService {
  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get('openaiAvailableModels');
    const defaultModelName = settingsManager.get('lastSelectedModel').openai;

    super(
      'openai',
      context,
      settingsManager,
      defaultModelName,
      availableModelNames,
    );
  }

  protected async handleGetNonStreamResponse(
    requestPayload: ChatCompletionCreateParamsBase,
  ): Promise<NonStreamCompletionOpenaiLike> {
    const openai = new OpenAI({
      apiKey: this.settingsManager.get('openaiApiKey'),
    });
    return openai.chat.completions.create({
      ...requestPayload,
      stream: false,
    });
  }

  protected async handleGetStreamResponse(
    requestPayload: ChatCompletionCreateParamsBase,
  ): Promise<StreamCompletionOpenaiLike> {
    const openai = new OpenAI({
      apiKey: this.settingsManager.get('openaiApiKey'),
    });
    return openai.chat.completions.create({
      ...requestPayload,
      stream: true,
    });
  }

  public async getLatestAvailableModelNames(): Promise<string[]> {
    const openai = new OpenAI({
      apiKey: this.settingsManager.get('openaiApiKey'),
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

    if (this.currentModel.includes('gpt-3.5') && options.images) {
      vscode.window.showWarningMessage(
        'The images ChatGPT-3.5 is not supported currently. The images will be ignored.',
      );
      options.images = undefined;
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
    } = options;
    const conversationHistory = await this.conversationHistoryToContent(
      historyManager.getHistoryBeforeEntry(currentEntryID).entries,
      query,
      historyManager,
      images,
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
      return this.handleGetResponseError(error, 'openai');
    } finally {
      this.stopStreamFlag = false;
      updateStatus && updateStatus('');
    }
  }

  public async stopResponse(): Promise<void> {
    this.stopStreamFlag = true;
  }
}
