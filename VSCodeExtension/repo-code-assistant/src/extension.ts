import fs from 'node:fs/promises';
import * as vscode from 'vscode';

import type {
  LoadedModelServices,
  LoadedVoiceServices,
  ViewApi,
  ViewApiError,
  ViewApiEvent,
  ViewApiRequest,
  ViewApiResponse,
  ViewEvents,
} from './types';
import { FileUtils } from './utils';
import { ViewKey } from './views';
import { viewRegistration, SettingsManager } from './api';
import {
  AnthropicService,
  CohereService,
  CustomApiService,
  GeminiService,
  GroqService,
  HuggingFaceService,
  OllamaService,
  OpenAIService,
} from './services/languageModel';
import {
  GptSoVitsApiService,
  GroqVoiceService,
  OpenaiVoiceService,
  VisualStudioCodeBuiltInService,
} from './services/voice';

export const activate = async (ctx: vscode.ExtensionContext) => {
  const connectedViews: Partial<Record<ViewKey, vscode.WebviewView>> = {};
  const settingsManager = SettingsManager.getInstance(ctx);

  const models: LoadedModelServices = {
    anthropic: {
      service: new AnthropicService(ctx, settingsManager),
    },
    gemini: {
      service: new GeminiService(ctx, settingsManager),
    },
    cohere: {
      service: new CohereService(ctx, settingsManager),
    },
    openai: {
      service: new OpenAIService(ctx, settingsManager),
    },
    groq: {
      service: new GroqService(ctx, settingsManager),
    },
    huggingFace: {
      service: new HuggingFaceService(ctx, settingsManager),
    },
    ollama: {
      service: new OllamaService(ctx, settingsManager),
    },
    custom: {
      service: new CustomApiService(ctx, settingsManager),
    },
  };

  const voiceServices: LoadedVoiceServices = {
    visualStudioCodeBuiltIn: {
      service: new VisualStudioCodeBuiltInService(ctx, settingsManager),
    },
    groq: {
      service: new GroqVoiceService(ctx, settingsManager),
    },
    gptSoVits: {
      service: new GptSoVitsApiService(ctx, settingsManager),
    },
    openai: {
      service: new OpenaiVoiceService(ctx, settingsManager),
    },
  };

  /**
   * Trigger an event on all connected views
   * @param key - The event key
   * @param params - The event parameters
   */
  const triggerEvent = <E extends keyof ViewEvents>(
    key: E,
    ...params: Parameters<ViewEvents[E]>
  ) => {
    Object.values(connectedViews).forEach((view) => {
      view.webview.postMessage({
        type: 'event',
        key,
        value: params,
      } as ViewApiEvent<E>);
    });
  };

  /**
   * Register and connect views to the extension
   * This uses for communication messages channel
   */
  const api: ViewApi = {
    getFileContents: async () => {
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        openLabel: 'Select file',
        title: 'Select file to read',
      });

      if (!uris?.length) {
        return '';
      }

      return await fs.readFile(uris[0].fsPath, 'utf-8');
    },
    setSetting: async (key, value) => {
      return settingsManager.set(key, value);
    },
    getSetting: (key) => {
      return settingsManager.get(key);
    },
    alertMessage: (msg, type) => {
      switch (type) {
        case 'info':
          vscode.window.showInformationMessage(msg);
          break;
        case 'warning':
          vscode.window.showWarningMessage(msg);
          break;
        case 'error':
          vscode.window.showErrorMessage(msg);
          break;
        default:
          vscode.window.showInformationMessage(msg);
      }
    },
    sendMessageToExampleB: (msg) => {
      triggerEvent('exampleBMessage', msg);
    },
    getLanguageModelResponse: async (
      modelType,
      query,
      images?,
      currentEntryID?,
      useStream?,
    ) => {
      return await models[modelType].service.getResponse({
        query,
        images,
        currentEntryID,
        sendStreamResponse: useStream ? api.sendStreamResponse : undefined,
      });
    },
    getLanguageModelConversationHistory: (modelType) => {
      return models[modelType].service.getConversationHistory();
    },
    addNewConversationHistory: (modelType) => {
      return models[modelType].service.addNewConversationHistory();
    },
    editLanguageModelConversationHistory: (modelType, entryID, newMessage) => {
      models[modelType].service.editConversationEntry(entryID, newMessage);
    },
    sendStreamResponse: (msg) => {
      triggerEvent('streamResponse', msg);
    },
    addConversationEntry: async (
      modelType,
      parentID,
      sender,
      message,
      images?,
    ) => {
      return models[modelType].service.addConversationEntry(
        parentID,
        sender,
        message,
        images,
      );
    },
    getHistories: (modelType) => {
      return models[modelType].service.getHistories();
    },
    switchHistory: (modelType, historyID) => {
      models[modelType].service.switchHistory(historyID);
    },
    deleteHistory: (modelType, historyID) => {
      return models[modelType].service.deleteHistory(historyID);
    },
    getAvailableModels: (modelType) => {
      if (modelType === 'custom') {
        return settingsManager.get('customModels').map((model) => model.name);
      }

      return settingsManager.get(`${modelType}AvailableModels`);
    },
    getCurrentModel: (modelType) => {
      return settingsManager.get(`lastSelectedModel`)[modelType];
    },
    setAvailableModels: (modelType, newAvailableModels) => {
      settingsManager
        .set(`${modelType}AvailableModels`, newAvailableModels)
        .then(() => {
          models[modelType].service.updateAvailableModels(newAvailableModels);
        });
    },
    setCustomModels: (newCustomModels) => {
      settingsManager.set('customModels', newCustomModels).then(() => {
        models.custom.service.updateAvailableModels(
          newCustomModels.map((model) => model.name),
        );
      });
    },
    switchModel: (modelType, modelName) => {
      models[modelType].service.switchModel(modelName);
    },
    updateHistoryTitleById: (modelType, historyID, title) => {
      models[modelType].service.updateHistoryTitleById(historyID, title);
    },
    getLatestAvailableModelNames: async (modelType) => {
      return await models[modelType].service.getLatestAvailableModelNames();
    },
    uploadImage: async (base64Data) => {
      return FileUtils.uploadFile(ctx, base64Data);
    },
    deleteImage: FileUtils.deleteFile,
    getWebviewUri: async (absolutePath: string) => {
      return await FileUtils.getWebviewUri(ctx, connectedViews, absolutePath);
    },
    convertTextToVoice: async (text) => {
      const voiceServiceType = settingsManager.get(
        'selectedTextToVoiceService',
      );

      if (voiceServiceType === 'not set') {
        vscode.window.showErrorMessage(
          'You have not selected a voice service for text to voice conversion, go to settings to select one',
        );
        return;
      }

      await voiceServices[voiceServiceType].service.textToVoice(text);
    },
    convertVoiceToText: async () => {
      const voiceServiceType = settingsManager.get(
        'selectedVoiceToTextService',
      );

      if (voiceServiceType === 'not set') {
        vscode.window.showErrorMessage(
          'You have not selected a voice service for voice to text conversion, go to voice settings to select one',
        );
        return '';
      }

      return voiceServices[voiceServiceType].service.voiceToText();
    },
    stopPlayVoice: async () => {
      const voiceServiceType = settingsManager.get(
        'selectedTextToVoiceService',
      );

      if (voiceServiceType === 'not set') {
        vscode.window.showErrorMessage(
          'You have not selected a voice service for voice playback, go to voice settings to select one',
        );
        return;
      }

      await voiceServices[voiceServiceType].service.stopTextToVoice();
    },
    switchGptSoVitsReferenceVoice: async (voiceName) => {
      await (
        voiceServices.gptSoVits.service as GptSoVitsApiService
      ).switchVoice(voiceName);
    },
    openExternalLink: async (url) => {
      await vscode.env.openExternal(vscode.Uri.parse(url));
    },
  };

  const isViewApiRequest = <K extends keyof ViewApi>(
    msg: unknown,
  ): msg is ViewApiRequest<K> =>
    msg != null &&
    typeof msg === 'object' &&
    'type' in msg &&
    msg.type === 'request';

  const registerAndConnectView = async <V extends ViewKey>(key: V) => {
    const view = await viewRegistration(ctx, key);
    connectedViews[key] = view;
    const onMessage = async (msg: Record<string, unknown>) => {
      if (!isViewApiRequest(msg)) {
        return;
      }
      try {
        // @ts-expect-error
        const val = await api[msg.key](...msg.params);
        const res: ViewApiResponse = {
          type: 'response',
          id: msg.id,
          value: val,
        };
        view.webview.postMessage(res);
      } catch (e: unknown) {
        const err: ViewApiError = {
          type: 'error',
          id: msg.id,
          value:
            e instanceof Error ? e.message : 'An unexpected error occurred',
        };
        view.webview.postMessage(err);
      }
    };

    view.webview.onDidReceiveMessage(onMessage);
  };

  registerAndConnectView('chatActivityBar').catch((e) => {
    console.error(e);
  });
  registerAndConnectView('workPanel').catch((e) => {
    console.error(e);
  });
};

export const deactivate = () => {
  return;
};
