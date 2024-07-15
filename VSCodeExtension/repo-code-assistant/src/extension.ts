import fs from 'node:fs/promises';
import path from 'node:path';
import * as vscode from 'vscode';

import type {
  ConversationHistory,
  CustomModelSettings,
  ExtensionSettings,
  LanguageModelService,
  LoadedModelServices,
  LoadedVoiceServices,
  ModelServiceType,
  ViewApi,
  ViewApiError,
  ViewApiEvent,
  ViewApiRequest,
  ViewApiResponse,
  ViewEvents,
} from './types';
import { ViewKey } from './views';
import { viewRegistration } from './api/viewRegistration';
import SettingsManager from './api/settingsManager';
import { GeminiService } from './services/languageModel/geminiService';
import { CohereService } from './services/languageModel/cohereService';
import { OpenAIService } from './services/languageModel/openaiService';
import { GroqService } from './services/languageModel/groqService';
import { HuggingFaceService } from './services/languageModel/huggingFaceService';
import { OllamaService } from './services/languageModel/ollamaService';
import { CustomApiService } from './services/languageModel/customApiService';
import { GptSoVitsApiService } from './services/Voice/gptSoVitsService';
import { Uri } from 'vscode';

export const activate = async (ctx: vscode.ExtensionContext) => {
  const connectedViews: Partial<Record<ViewKey, vscode.WebviewView>> = {};
  const settingsManager = SettingsManager.getInstance();
  const customModels = settingsManager.getCustomModels();
  const customModelNames = customModels.map((model) => model.name);

  const models: LoadedModelServices = {
    gemini: {
      service: new GeminiService(ctx, settingsManager),
      enabled: settingsManager.get('enableModel').gemini,
    },
    cohere: {
      service: new CohereService(ctx, settingsManager),
      enabled: settingsManager.get('enableModel').cohere,
    },
    openai: {
      service: new OpenAIService(ctx, settingsManager),
      enabled: settingsManager.get('enableModel').openai,
    },
    groq: {
      service: new GroqService(ctx, settingsManager),
      enabled: settingsManager.get('enableModel').groq,
    },
    huggingFace: {
      service: new HuggingFaceService(ctx, settingsManager),
      enabled: settingsManager.get('enableModel').huggingFace,
    },
    ollama: {
      service: new OllamaService(ctx, settingsManager),
      enabled: settingsManager.get('enableModel').ollama,
    },
    custom: {
      service: new CustomApiService(ctx, settingsManager, customModelNames),
      enabled: settingsManager.get('enableModel').custom,
    },
  };

  const voiceServices: LoadedVoiceServices = {
    gptSoVits: {
      service: new GptSoVitsApiService(ctx, settingsManager),
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
    setSetting: async (
      key: keyof ExtensionSettings,
      value: ExtensionSettings[typeof key],
    ) => {
      return settingsManager.set(key, value);
    },
    getSetting: (key: keyof ExtensionSettings) => {
      return settingsManager.get(key);
    },
    alertMessage: (msg: string, type: 'info' | 'warning' | 'error') => {
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
    sendMessageToExampleB: (msg: string) => {
      triggerEvent('exampleBMessage', msg);
    },
    getLanguageModelResponse: async (
      query: string,
      modelType: ModelServiceType,
      useStream?: boolean,
      currentEntryID?: string,
    ) => {
      const modelService = models[modelType].service;
      if (!modelService) {
        vscode.window.showErrorMessage(
          `Failed to get response for unknown model type: ${modelType}`,
        );
        return `Model service not found for type: ${modelType}`;
      }

      try {
        return useStream
          ? modelService.getResponseChunksForQuery(
              query,
              api.sendStreamResponse,
              currentEntryID,
            )
          : modelService.getResponseForQuery(query, currentEntryID);
      } catch (error) {
        return `Failed to get response from ${modelType} service: ${error}`;
      }
    },
    getLanguageModelConversationHistory: (modelType: ModelServiceType) => {
      const modelService: LanguageModelService = models[modelType].service;
      if (!modelService) {
        vscode.window.showErrorMessage(
          `Failed to get conversation history for unknown model type: ${modelType}`,
        );
        return {
          title: '',
          create_time: 0,
          update_time: 0,
          root: '',
          current: '',
          entries: {},
        } as ConversationHistory;
      }

      return modelService.getConversationHistory();
    },
    addNewConversationHistory: (modelType: ModelServiceType) => {
      const modelService: LanguageModelService = models[modelType].service;

      if (!modelService) {
        vscode.window.showErrorMessage(
          `Failed to clear conversation history for unknown model type: ${modelType}`,
        );
        return {
          title: '',
          create_time: 0,
          update_time: 0,
          root: '',
          current: '',
          entries: {},
        } as ConversationHistory;
      }

      return modelService.addNewConversationHistory();
    },
    editLanguageModelConversationHistory: (
      modelType: ModelServiceType,
      entryID: string,
      newMessage: string,
    ) => {
      const modelService: LanguageModelService = models[modelType].service;

      if (!modelService) {
        vscode.window.showErrorMessage(
          `Failed to edit conversation history for unknown model type: ${modelType}`,
        );
        return;
      }

      modelService.editConversationEntry(entryID, newMessage);
    },
    sendStreamResponse: (msg: string) => {
      triggerEvent('streamResponse', msg);
    },
    addConversationEntry: async (
      modelType: ModelServiceType,
      parentID: string,
      sender: 'user' | 'AI',
      message: string,
      images?: string[],
    ) => {
      const modelService: LanguageModelService = models[modelType].service;

      if (!modelService) {
        vscode.window.showErrorMessage(
          `Failed to add conversation entry for unknown model type: ${modelType}`,
        );
        return '';
      }

      return modelService.addConversationEntry(
        parentID,
        sender,
        message,
        images,
      );
    },
    getHistories: (modelType: ModelServiceType) => {
      const modelService: LanguageModelService = models[modelType].service;

      if (!modelService) {
        vscode.window.showErrorMessage(
          `Failed to load conversation histories for unknown model type: ${modelType}`,
        );
        return {};
      }

      return modelService.getHistories();
    },
    switchHistory: (modelType: ModelServiceType, historyID: string) => {
      const modelService: LanguageModelService = models[modelType].service;

      if (!modelService) {
        vscode.window.showErrorMessage(
          `Failed to switch conversation history for unknown model type: ${modelType}`,
        );
        return;
      }

      modelService.switchHistory(historyID);
    },
    deleteHistory: (modelType: ModelServiceType, historyID: string) => {
      const modelService: LanguageModelService = models[modelType].service;

      if (!modelService) {
        vscode.window.showErrorMessage(
          `Failed to delete conversation history for unknown model type: ${modelType}`,
        );
        return {
          title: '',
          create_time: 0,
          update_time: 0,
          root: '',
          current: '',
          entries: {},
        } as ConversationHistory;
      }

      return modelService.deleteHistory(historyID);
    },
    getAvailableModels: (modelType: ModelServiceType) => {
      const modelService: LanguageModelService = models[modelType].service;

      if (!modelService) {
        vscode.window.showErrorMessage(
          `Failed to get available models for unknown model type: ${modelType}`,
        );
        return [];
      }

      return modelService.getAvailableModels();
    },
    setAvailableModels: (
      modelType: ModelServiceType,
      newAvailableModels: string[],
    ) => {
      const modelService: LanguageModelService = models[modelType].service;

      if (!modelService || modelType === 'custom') {
        vscode.window.showErrorMessage(
          `Failed to set available models for unknown model type: ${modelType}`,
        );
        return;
      }

      settingsManager.set(`${modelType}AvailableModels`, newAvailableModels);
    },
    switchModel: (modelType: ModelServiceType, modelName: string) => {
      const modelService: LanguageModelService = models[modelType].service;

      if (!modelService) {
        vscode.window.showErrorMessage(
          `Failed to switch language model for unknown model type: ${modelType}`,
        );
        return;
      }

      modelService.switchModel(modelName);
    },
    updateHistoryTitleById: (
      modelType: ModelServiceType,
      historyID: string,
      title: string,
    ) => {
      const modelService: LanguageModelService = models[modelType].service;

      if (!modelService) {
        vscode.window.showErrorMessage(
          `Failed to update conversation history title for unknown model type: ${modelType}`,
        );
        return;
      }

      modelService.updateHistoryTitleById(historyID, title);
    },
    getLanguageModelResponseWithImage: async (
      query: string,
      modelType: ModelServiceType,
      images: string[],
      currentEntryID?: string,
    ) => {
      const modelService: LanguageModelService = models[modelType].service;

      if (!modelService) {
        vscode.window.showErrorMessage(
          `Failed to get response for unknown model type: ${modelType}`,
        );
        return `Model service not found for type: ${modelType}`;
      }

      try {
        return modelService.getResponseChunksForQueryWithImage(
          query,
          images,
          api.sendStreamResponse,
          currentEntryID,
        );
      } catch (error) {
        return `Failed to get response from ${modelType} service: ${error}`;
      }
    },
    getLatestAvailableModelNames: async (modelType: ModelServiceType) => {
      const modelService: LanguageModelService = models[modelType].service;

      if (!modelService) {
        vscode.window.showErrorMessage(
          `Failed to get latest available model names for unknown model type: ${modelType}`,
        );
        return [];
      }

      return await modelService.getLatestAvailableModelNames();
    },
    uploadImage: async (base64Data: string) => {
      const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid input string');
      }

      const buffer = Buffer.from(matches[2], 'base64');
      const mediaDir = path.join(ctx.extensionPath, 'media');

      // Create the media directory if it does not exist
      try {
        await fs.mkdir(mediaDir, { recursive: true });
      } catch (error) {
        throw new Error('Failed to create media directory: ' + error);
      }

      // Generate a unique filename to avoid conflicts
      const filename = path.join(mediaDir, `uploaded_image_${Date.now()}.png`);

      try {
        await fs.writeFile(filename, buffer);
      } catch (error) {
        throw new Error('Failed to write image file: ' + error);
      }

      return filename;
    },
    deleteImage: async (imagePath: string) => {
      try {
        await fs.unlink(imagePath);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to delete image: ${error}`);
      }
    },
    getWebviewUri: (absolutePath: string) => {
      const extensionPath = ctx.extensionPath.endsWith(path.sep)
        ? ctx.extensionPath
        : ctx.extensionPath + path.sep;

      const relativePath = path.relative(extensionPath, absolutePath);

      const panel = connectedViews?.chatActivityBar;

      if (!panel) return '';

      const imagePath = path.join(ctx.extensionPath, relativePath);

      const imageUri = panel.webview.asWebviewUri(vscode.Uri.file(imagePath));

      return imageUri.toString();
    },
    getCustomModels: () => {
      return settingsManager.get('customModels');
    },
    setCustomModels: (newCustomModelSettings: CustomModelSettings[]) => {
      settingsManager.set('customModels', newCustomModelSettings);
    },
    convertTextToVoice: async (voiceServiceType, text) => {
      if (voiceServiceType === 'not set') {
        vscode.window.showErrorMessage(
          'You have not selected a voice service for text to voice conversion, go to settings to select one',
        );
        return;
      }

      const voiceService = voiceServices[voiceServiceType].service;
      if (!voiceService) {
        vscode.window.showErrorMessage(
          `Failed to convert text to voice for unknown voice service type: ${voiceServiceType}`,
        );
        return;
      }

      await voiceService.textToVoice(text);
    },
    convertVoiceToText: async (voiceServiceType) => {
      if (voiceServiceType === 'not set') {
        vscode.window.showErrorMessage(
          'You have not selected a voice service for voice to text conversion, go to settings to select one',
        );
        return '';
      }

      const voiceService = voiceServices[voiceServiceType].service;
      if (!voiceService) {
        vscode.window.showErrorMessage(
          `Failed to convert voice to text for unknown voice service type: ${voiceServiceType}`,
        );
        return '';
      }

      // TODO: Record voice
      return 'Recorded voice as text';
    },
    stopPlayVoice: async (voiceServiceType) => {
      if (voiceServiceType === 'not set') {
        vscode.window.showErrorMessage(
          'You have not selected a voice service for voice playback, go to settings to select one',
        );
        return;
      }

      const voiceService = voiceServices[voiceServiceType].service;
      if (!voiceService) {
        vscode.window.showErrorMessage(
          `Failed to stop voice playback for unknown voice service type: ${voiceServiceType}`,
        );
        return;
      }

      await voiceService.stopVoice();
    },
    switchGptSoVitsReferenceVoice: async (voiceName) => {
      const voiceService = voiceServices.gptSoVits
        .service as GptSoVitsApiService;
      if (!voiceService) {
        vscode.window.showErrorMessage(
          `Failed to switch voice for GPT-SoVits service`,
        );
        return;
      }

      await voiceService.switchVoice(voiceName);
    },
    getSelectedGptSoVitsReferenceVoice: () => {
      return settingsManager.getSelectedGptSoVitsReferenceVoice();
    },
    openExternalLink: async (url) => {
      await vscode.env.openExternal(Uri.parse(url));
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
