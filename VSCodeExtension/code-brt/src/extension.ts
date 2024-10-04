import * as vscode from 'vscode';

import type {
  ViewApi,
  ViewApiError,
  ViewApiEvent,
  ViewApiRequest,
  ViewApiResponse,
  ViewEvents,
} from './types';
import {
  AVAILABLE_MODEL_SERVICES,
  AVAILABLE_VOICE_SERVICES,
} from './constants';
import { FileUtils } from './utils';
import { ViewKey } from './views';
import {
  viewRegistration,
  SettingsManager,
  HistoryManager,
  registerInlineCompletion,
} from './api';
import { ModelServiceFactory } from './services/languageModel';
import { VoiceServiceFactory } from './services/voice';
import { GptSoVitsApiService } from './services/voice/gptSoVitsService';
import { convertPdfToMarkdown } from './utils/pdfConverter';

let extensionContext: vscode.ExtensionContext | undefined = undefined;

export const activate = async (ctx: vscode.ExtensionContext) => {
  extensionContext = ctx;

  const connectedViews: Partial<Record<ViewKey, vscode.WebviewView>> = {};
  const settingsManager = SettingsManager.getInstance(ctx);
  const historyManager = new HistoryManager(ctx);

  // Create a model service factory instance
  const modelServiceFactory = new ModelServiceFactory(ctx, settingsManager);
  const models = modelServiceFactory.createModelServices(
    AVAILABLE_MODEL_SERVICES,
  );
  const voiceServiceFactory = new VoiceServiceFactory(ctx, settingsManager);
  const voiceServices = voiceServiceFactory.createVoiceServices(
    AVAILABLE_VOICE_SERVICES,
  );

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
    extractPdfText: async (filePath) => {
      return await convertPdfToMarkdown(filePath);
    },
    setSettingByKey: async (key, value) => {
      await settingsManager.set(key, value);
    },
    getSettingByKey: (key) => {
      return settingsManager.get(key);
    },
    getAllSettings: async () => {
      return await settingsManager.getAllSettings();
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
    alertReload: (message) => {
      vscode.window
        .showInformationMessage(
          message ??
            'The setting will take effect after the extension is reloaded',
          'Reload',
        )
        .then((selection) => {
          if (selection === 'Reload') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
          }
        });
    },
    getLanguageModelResponse: async (
      modelServiceType,
      query,
      images?,
      currentEntryID?,
      useStream?,
      showStatus?,
    ) => {
      return await models[modelServiceType].service.getResponse({
        query,
        historyManager,
        images,
        currentEntryID,
        sendStreamResponse: useStream
          ? (msg) => {
              triggerEvent('streamResponse', msg);
            }
          : undefined,
        updateStatus: showStatus
          ? (status) => {
              triggerEvent('updateStatus', status);
            }
          : undefined,
      });
    },
    stopLanguageModelResponse: (modelServiceType) => {
      models[modelServiceType].service.stopResponse();
    },
    getCurrentHistory: () => {
      return historyManager.getCurrentHistory();
    },
    addNewConversationHistory: async () => {
      return await historyManager.addNewConversationHistory();
    },
    editLanguageModelConversationHistory: (entryID, newMessage) => {
      historyManager.editConversationEntry(entryID, newMessage);
    },
    getHistoryIndexes: () => {
      return historyManager.getHistoryIndexes();
    },
    switchHistory: (historyID) => {
      return historyManager.switchHistory(historyID);
    },
    deleteHistory: async (historyID) => {
      return await historyManager.deleteHistory(historyID);
    },
    updateHistoryTitleById: (historyID, title) => {
      historyManager.updateHistoryTitleById(historyID, title);
    },
    addHistoryTag: (historyID, tag) => {
      historyManager.addTagToHistory(historyID, tag);
    },
    removeHistoryTag: (historyID, tag) => {
      historyManager.removeTagFromHistory(historyID, tag);
    },
    updateHistoryModelAdvanceSettings: (historyID, advanceSettings) => {
      historyManager.updateHistoryModelAdvanceSettings(
        historyID,
        advanceSettings,
      );
    },
    addConversationEntry: async (
      parentID,
      sender,
      message,
      images?,
      modelServiceType?,
    ) => {
      return await historyManager.addConversationEntry(
        parentID,
        sender,
        message,
        images,
        modelServiceType,
      );
    },
    getAvailableModels: (modelServiceType) => {
      if (modelServiceType === 'custom') {
        return settingsManager.get('customModels').map((model) => model.name);
      }

      return settingsManager.get(`${modelServiceType}AvailableModels`);
    },
    getCurrentModel: (modelServiceType) => {
      return settingsManager.get(`lastSelectedModel`)[modelServiceType];
    },
    setAvailableModels: (modelServiceType, newAvailableModels) => {
      settingsManager
        .set(`${modelServiceType}AvailableModels`, newAvailableModels)
        .then(() => {
          models[modelServiceType].service.updateAvailableModels(
            newAvailableModels,
          );
        });
    },
    setCustomModels: (newCustomModels) => {
      settingsManager.set('customModels', newCustomModels).then(() => {
        models.custom.service.updateAvailableModels(
          newCustomModels.map((model) => model.name),
        );
      });
    },
    switchModel: (modelServiceType, modelName) => {
      models[modelServiceType].service.switchModel(modelName);
    },
    getLatestAvailableModelNames: async (modelServiceType) => {
      return await models[
        modelServiceType
      ].service.getLatestAvailableModelNames();
    },
    uploadFile: async (base64Data, originalFileName) => {
      return FileUtils.uploadFile(ctx, base64Data, originalFileName);
    },
    deleteFile: FileUtils.deleteFile,
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
    stopRecordVoice: async () => {
      const voiceServiceType = settingsManager.get(
        'selectedVoiceToTextService',
      );

      if (voiceServiceType === 'not set') {
        vscode.window.showErrorMessage(
          'You have not selected a voice service for voice recording, How did you even get here? Please report this bug to the developers',
        );
        return;
      }

      await voiceServices[voiceServiceType].service.stopVoiceToText();
    },
    switchGptSoVitsReferenceVoice: async (voiceName) => {
      await (
        voiceServices.gptSoVits.service as GptSoVitsApiService
      ).switchVoice(voiceName);
    },
    openExternalLink: async (url) => {
      await vscode.env.openExternal(vscode.Uri.parse(url));
    },
    openKeyboardShortcuts: async (commandId) => {
      await vscode.commands.executeCommand(
        'workbench.action.openGlobalKeybindings',
        `@command:${commandId}`,
      );
    },
    openExtensionMarketplace: async (extensionId) => {
      await vscode.commands.executeCommand(
        'workbench.extensions.search',
        extensionId,
      );
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
    const webviewOptions: vscode.WebviewOptions = {
      enableScripts: true,
    };
    const retainContextWhenHidden = settingsManager.get(
      'retainContextWhenHidden',
    );
    const view = await viewRegistration(
      ctx,
      key,
      webviewOptions,
      retainContextWhenHidden,
    );
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

  registerInlineCompletion(ctx, settingsManager);
};

export const deactivate = () => {
  extensionContext?.subscriptions?.forEach((sub) => sub.dispose());
};
