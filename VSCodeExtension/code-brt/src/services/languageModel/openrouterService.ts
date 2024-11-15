import * as vscode from 'vscode';
import OpenAI from 'openai';

import type {
  ChatCompletionCreateParamsBaseOpenaiLike,
  GetResponseOptions,
  NonStreamCompletionOpenaiLike,
  ResponseWithAction,
  StreamCompletionOpenaiLike,
} from './types';
import type { OpenRouterModelSettings } from '../../types';
import { AbstractOpenaiLikeService } from './base';
import { SettingsManager } from '../../api';

export class OpenRouterService extends AbstractOpenaiLikeService {
  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager
      .get('openRouterModels')
      .map((modelConfig: OpenRouterModelSettings) => modelConfig.name);
    const defaultModelName =
      settingsManager.get('lastSelectedModel').openRouter;

    super(
      'openRouter',
      context,
      settingsManager,
      defaultModelName,
      availableModelNames,
    );
  }

  private getSelectedModelConfig(
    modelName?: string,
  ): OpenRouterModelSettings | undefined {
    const openRouterModels = this.settingsManager.get('openRouterModels');
    return openRouterModels.find(
      (config: OpenRouterModelSettings) =>
        config.name === (modelName || this.currentModel),
    );
  }

  protected async handleGetNonStreamResponse(
    requestPayload: ChatCompletionCreateParamsBaseOpenaiLike,
  ): Promise<NonStreamCompletionOpenaiLike> {
    const selectedModelConfig = this.getSelectedModelConfig();
    if (!selectedModelConfig) {
      throw new Error('No OpenRouter model configuration found');
    }

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: selectedModelConfig.apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://whats2000.github.io/CodeBRT/',
        'X-Title': 'CodeBRT',
      },
    });

    return openai.chat.completions.create({
      ...requestPayload,
      stream: false,
      model: selectedModelConfig.id,
    });
  }

  protected async handleGetStreamResponse(
    requestPayload: ChatCompletionCreateParamsBaseOpenaiLike,
  ): Promise<StreamCompletionOpenaiLike> {
    const selectedModelConfig = this.getSelectedModelConfig();
    if (!selectedModelConfig) {
      throw new Error('No OpenRouter model configuration found');
    }

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: selectedModelConfig.apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://whats2000.github.io/CodeBRT/',
        'X-Title': 'CodeBRT',
      },
    });

    return openai.chat.completions.create({
      ...requestPayload,
      stream: true,
      model: selectedModelConfig.id,
    });
  }

  public async getLatestAvailableModelNames(): Promise<string[]> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models');
      const models = await response.json();

      return models.data
        .map((model: any) => model.name)
        .filter((name: string) => name.length > 0);
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to fetch available models: ' + error,
      );
      return this.availableModelNames;
    }
  }

  public async getResponse(
    options: GetResponseOptions,
  ): Promise<ResponseWithAction> {
    // Standard model validation and preparation
    if (this.currentModel === '') {
      vscode.window.showErrorMessage(
        'Make sure the OpenRouter model is selected before sending a message.',
      );
      return {
        textResponse: 'Missing model configuration.',
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
    const conversationHistory = await this.conversationHistoryToContent(
      historyManager.getHistoryBeforeEntry(currentEntryID).entries,
      query,
      historyManager,
      currentEntryID,
      images,
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
      return this.handleGetResponseError(error, 'openRouter');
    } finally {
      this.stopStreamFlag = false;
      updateStatus && updateStatus('');
    }
  }

  public async stopResponse(): Promise<void> {
    this.stopStreamFlag = true;
  }
}
