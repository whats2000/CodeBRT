import * as vscode from 'vscode';

import type { ViewApi } from './types';
import {
  AVAILABLE_MODEL_SERVICES,
  AVAILABLE_VOICE_SERVICES,
} from './constants';
import { FileUtils } from './utils';
import {
  connectedViews,
  HistoryManager,
  registerAndConnectView,
  registerInlineCompletion,
  SettingsManager,
  triggerEvent,
} from './api';
import { ModelServiceFactory } from './services/languageModel';
import { VoiceServiceFactory } from './services/voice';
import { GptSoVitsApiService } from './services/voice/gptSoVitsService';
import { convertPdfToMarkdown } from './utils/pdfConverter';
import { ToolServiceProvider } from './services/tools';

let extensionContext: vscode.ExtensionContext | undefined = undefined;

export const activate = async (ctx: vscode.ExtensionContext) => {
  extensionContext = ctx;
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
    addConversationEntry: async (entry) => {
      return await historyManager.addConversationEntry(entry);
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
    approveToolCall: async (toolCall) => {
      return await ToolServiceProvider.executeToolCall(toolCall, (status) => {
        triggerEvent('updateStatus', status);
      });
    },
    rejectToolCall: async (_entry) => {},
  };

  void registerAndConnectView(ctx, settingsManager, 'chatActivityBar', api);
  void registerAndConnectView(ctx, settingsManager, 'workPanel', api);
  registerInlineCompletion(ctx, settingsManager, connectedViews);
};

export const deactivate = () => {
  extensionContext?.subscriptions?.forEach((sub) => sub.dispose());
};
