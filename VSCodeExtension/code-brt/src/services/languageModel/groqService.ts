import * as vscode from 'vscode';

import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
} from 'groq-sdk/src/resources/chat/completions';
import Groq from 'groq-sdk';

import type { GetResponseOptions, ResponseWithAction } from './types';
import { MODEL_SERVICE_CONSTANTS } from '../../constants';
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
      selectedModelName,
      disableTools,
    } = options;

    if (images && images.length > 0) {
      vscode.window.showWarningMessage(
        'The images inference is not supported currently. The images will be ignored.',
      );
    }

    const groq = new Groq({
      apiKey: this.settingsManager.get('groqApiKey'),
    });

    const conversationHistory = await this.conversationHistoryToContent(
      historyManager.getHistoryBeforeEntry(currentEntryID).entries,
      query,
      historyManager,
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
        const response = await groq.chat.completions.create({
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

        const streamResponse = await groq.chat.completions.create({
          messages: conversationHistory,
          model: selectedModelName ?? this.currentModel,
          stream: true,
          tools: disableTools ? undefined : this.getEnabledTools(),
          ...generationConfig,
        } as ChatCompletionCreateParamsStreaming);

        return await this.handleStreamResponse(
          streamResponse,
          sendStreamResponse,
        );
      }
    } catch (error) {
      vscode.window
        .showErrorMessage(
          'Failed to get response from Groq Service: ' + error,
          'Get API Key',
        )
        .then((selection) => {
          if (selection === 'Get API Key') {
            vscode.env.openExternal(
              vscode.Uri.parse(MODEL_SERVICE_CONSTANTS.groq.apiLink),
            );
          }
        });
      return {
        textResponse: 'Failed to connect to the language model service.',
      };
    } finally {
      this.stopStreamFlag = false;
    }
  }

  public async stopResponse(): Promise<void> {
    this.stopStreamFlag = true;
  }
}
