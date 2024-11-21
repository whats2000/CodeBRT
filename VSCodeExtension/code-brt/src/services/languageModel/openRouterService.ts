import * as vscode from 'vscode';
import OpenAI from 'openai';
import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';

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
      apiKey: this.settingsManager.get('openRouterApiKey'),
      defaultHeaders: {
        'HTTP-Referer': 'https://whats2000.github.io/CodeBRT/',
        'X-Title': 'CodeBRT',
      },
    });

    const updatedRequestPayload = {
      ...requestPayload,
      max_tokens: selectedModelConfig.context_length || undefined,
      max_completion_tokens:
        selectedModelConfig.top_provider.max_completion_tokens || undefined,
    };

    return openai.chat.completions.create({
      ...updatedRequestPayload,
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
      apiKey: this.settingsManager.get('openRouterApiKey'),
      defaultHeaders: {
        'HTTP-Referer': 'https://whats2000.github.io/CodeBRT/',
        'X-Title': 'CodeBRT',
      },
    });

    const updatedRequestPayload = {
      ...requestPayload,
      max_tokens: selectedModelConfig.context_length || undefined,
      max_completion_tokens:
        selectedModelConfig.top_provider.max_completion_tokens || undefined,
    };

    return openai.chat.completions.create({
      ...updatedRequestPayload,
      stream: true,
      model: selectedModelConfig.id,
    });
  }

  public async getLatestAvailableModels(): Promise<OpenRouterModelSettings[]> {
    const requestUrl = `https://openrouter.ai/api/v1/models`;

    try {
      const response = await axios.get(requestUrl).catch(console.error);

      if (!response || response.status !== 200) {
        vscode.window.showErrorMessage(
          'Failed to fetch available models from OpenRouter',
        );
        return [];
      }

      // The request will not contain the apiKey and uuid
      const latestModelsInfo:
        | Omit<OpenRouterModelSettings, 'apiKey' | 'uuid'>[]
        | undefined = response.data.data;

      if (!latestModelsInfo) {
        vscode.window.showErrorMessage(
          'Failed to fetch available models from OpenRouter',
        );
        return [];
      }

      return latestModelsInfo.map((modelInfo) => ({
        ...modelInfo,
        apiKey: '',
        uuid: uuidV4(),
      }));
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to fetch available models: ' + error,
      );
      return [];
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
      console.log(error);
      return this.handleGetResponseError(error, 'openRouter');
    } finally {
      this.stopStreamFlag = false;
      updateStatus && updateStatus('');
    }
  }

  public async stopResponse(): Promise<void> {
    this.stopStreamFlag = true;
  }

  public async switchModel(modelName: string): Promise<void> {
    const openRouterModel = this.settingsManager.get('openRouterModels');
    const selectedModel = openRouterModel.find(
      (model) => model.name === modelName,
    );

    if (!selectedModel) {
      const lastSelectedModel = this.settingsManager.get('lastSelectedModel');
      this.currentModel = '';
      lastSelectedModel.openRouter = '';
      this.settingsManager
        .set('lastSelectedModel', lastSelectedModel)
        .then(() => {
          void vscode.window.showErrorMessage(
            'Model not found. Please configure the models first.',
          );
        });
      return;
    }
    super.switchModel(modelName);
  }
}
