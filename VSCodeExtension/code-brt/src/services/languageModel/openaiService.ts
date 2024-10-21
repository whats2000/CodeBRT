import * as vscode from 'vscode';
import type {
  ChatCompletionCreateParamsStreaming,
  ChatCompletionCreateParamsNonStreaming,
} from 'openai/resources/chat/completions';
import OpenAI from 'openai';

import type { GetResponseOptions, ResponseWithAction } from './types';
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
      selectedModelName,
      disableTools,
    } = options;
    const openai = new OpenAI({
      apiKey: this.settingsManager.get('openaiApiKey'),
    });

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

    try {
      if (!sendStreamResponse) {
        const response = await openai.chat.completions.create({
          messages: conversationHistory,
          model: selectedModelName ?? this.currentModel,
          tools: disableTools ? undefined : this.getEnabledTools(),
          stream: false,
          ...generationConfig,
        } as ChatCompletionCreateParamsNonStreaming);

        return await this.handleNonStreamResponse(response);
      } else {
        if (this.stopStreamFlag) {
          return { textResponse: '' };
        }

        const streamResponse = await openai.chat.completions.create({
          model: selectedModelName ?? this.currentModel,
          messages: conversationHistory,
          tools: disableTools ? undefined : this.getEnabledTools(),
          stream: true,
          ...generationConfig,
        } as ChatCompletionCreateParamsStreaming);

        return await this.handleStreamResponse(
          streamResponse,
          sendStreamResponse,
        );
      }
    } catch (error) {
      return this.handleGetResponseError(error, 'openai');
    } finally {
      this.stopStreamFlag = false;
    }
  }

  public async stopResponse(): Promise<void> {
    this.stopStreamFlag = true;
  }
}
