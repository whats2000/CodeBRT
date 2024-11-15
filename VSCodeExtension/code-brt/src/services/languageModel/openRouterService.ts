import * as vscode from 'vscode';
import OpenAI from 'openai';
import axios from 'axios';

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

type OpenRouterModelSetting = {
  id: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type: string | null;
  };
  pricing: {
    prompt: string;
    completion: string;
    image: string;
    request: string;
  };
  top_provider: {
    context_length: number | null;
    max_completion_tokens: number | null;
    is_moderated: boolean | null;
  };
  per_request_limits: number | null;
};

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
      apiKey:
        selectedModelConfig.apiKey !== ''
          ? selectedModelConfig.apiKey
          : undefined,
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
    const requestUrl = `https://openrouter.ai/api/v1/models`;

    let newAvailableModelNames: string[] = [...this.availableModelNames];

    try {
      const response = await axios.get(requestUrl).catch(console.error);

      if (!response || response.status !== 200) {
        vscode.window.showErrorMessage(
          'Failed to fetch available models from OpenRouter',
        );
        return this.availableModelNames;
      }

      const latestModelsInfo: OpenRouterModelSetting[] | undefined =
        response.data.data;

      if (!latestModelsInfo) {
        vscode.window.showErrorMessage(
          'Failed to fetch available models from OpenRouter',
        );
        return this.availableModelNames;
      }

      const latestModels = latestModelsInfo
        .map((model: OpenRouterModelSetting) => model.name)
        .filter((name: string) => name.length > 0);

      // Filter the invalid models from the available models
      newAvailableModelNames = newAvailableModelNames.filter((name) =>
        latestModels.some((model) => model === name),
      );

      // Append the models to the available models if they aren't already there
      latestModels.forEach((model) => {
        if (newAvailableModelNames.includes(model)) return;

        newAvailableModelNames.push(model);
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
