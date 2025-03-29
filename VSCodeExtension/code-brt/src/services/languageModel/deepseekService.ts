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

export class DeepseekService extends AbstractOpenaiLikeService {
  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get('deepseekAvailableModels');
    const defaultModelName = settingsManager.get('lastSelectedModel').deepseek;

    super(
      'deepseek',
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
      apiKey: this.settingsManager.get('deepseekApiKey'),
      baseURL: 'https://api.deepseek.com',
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
      apiKey: this.settingsManager.get('deepseekApiKey'),
      baseURL: 'https://api.deepseek.com',
    });
    return openai.chat.completions.create({
      ...requestPayload,
      stream: true,
    });
  }

  public async getLatestAvailableModelNames(): Promise<string[]> {
    const requestUrl = `https://api-docs.deepseek.com/quick_start/pricing`;
    vscode.window
      .showWarningMessage(
        'The Deepseek model list is not available fetch by API. Please check the Deepseek website for the latest models.',
        'Open Deepseek Website',
      )
      .then((selection) => {
        if (selection === 'Open Deepseek Website') {
          vscode.env.openExternal(vscode.Uri.parse(requestUrl));
        }
      });

    return this.availableModelNames;
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
      currentEntryID,
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
      return this.handleGetResponseError(error, 'deepseek');
    } finally {
      this.stopStreamFlag = false;
      updateStatus && updateStatus('');
    }
  }

  public async stopResponse(): Promise<void> {
    this.stopStreamFlag = true;
  }
}
