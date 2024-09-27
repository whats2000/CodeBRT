import fs from 'node:fs/promises';
import * as vscode from 'vscode';
import * as jsdiff from 'diff';

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
import { viewRegistration, SettingsManager, HistoryManager } from './api';
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

import { GeminiCodeFixerService } from './services/codeFixer/geminiCodeFixerService';

import * as Commands from './diff/commands';

export const activate = async (ctx: vscode.ExtensionContext) => {
  const connectedViews: Partial<Record<ViewKey, vscode.WebviewView>> = {};
  const settingsManager = SettingsManager.getInstance(ctx);
  const historyManager = new HistoryManager(ctx);

  const geminiCodeFixerService = new GeminiCodeFixerService(
    ctx,
    settingsManager,
  );

  const models: LoadedModelServices = {
    anthropic: {
      service: new AnthropicService(ctx, settingsManager, historyManager),
    },
    gemini: {
      service: new GeminiService(ctx, settingsManager, historyManager),
    },
    cohere: {
      service: new CohereService(ctx, settingsManager, historyManager),
    },
    openai: {
      service: new OpenAIService(ctx, settingsManager, historyManager),
    },
    groq: {
      service: new GroqService(ctx, settingsManager, historyManager),
    },
    huggingFace: {
      service: new HuggingFaceService(ctx, settingsManager, historyManager),
    },
    ollama: {
      service: new OllamaService(ctx, settingsManager, historyManager),
    },
    custom: {
      service: new CustomApiService(ctx, settingsManager, historyManager),
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

  let addedDecorationType: vscode.TextEditorDecorationType;
  let removedDecorationType: vscode.TextEditorDecorationType;

  // 初始化裝飾類型
  addedDecorationType = vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    backgroundColor: 'rgba(144,238,144,0.5)', // 綠色背景（新增）
  });

  removedDecorationType = vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    backgroundColor: 'rgba(255,99,71,0.5)', // 紅色背景（刪除）
  });

  interface Modification {
    startLine: number; // 修改的開始行號
    endLine: number; // 修改的結束行號
    content: string; // 要插入的內容，如果是刪除操作則為空字串
  }
  // 顯示程式碼差異的 API
  const showDiffInEditor = async (modifications: Modification[]) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('未能找到編輯器');
      return;
    }

    const addedRanges: vscode.DecorationOptions[] = [];
    const removedRanges: vscode.DecorationOptions[] = [];

    modifications.forEach((modification) => {
      const startLine = modification.startLine - 1; // 調整行號到 0-based
      const endLine = modification.endLine - 1;

      if (modification.content) {
        // 新增或替換的部分
        const startPos = new vscode.Position(startLine, 0);
        const endPos = editor.document.lineAt(endLine).range.end;
        addedRanges.push({ range: new vscode.Range(startPos, endPos) });
      } else {
        // 刪除的部分
        const startPos = new vscode.Position(startLine, 0);
        const endPos = editor.document.lineAt(endLine).range.end;
        removedRanges.push({ range: new vscode.Range(startPos, endPos) });
      }
    });

    // 應用裝飾
    editor.setDecorations(addedDecorationType, addedRanges);
    editor.setDecorations(removedDecorationType, removedRanges);
  };

  // 清除裝飾的 API
  const clearDecorations = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('未能找到編輯器');
      return;
    }
    // 清除裝飾
    editor.setDecorations(addedDecorationType, []);
    editor.setDecorations(removedDecorationType, []);
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
    getLanguageModelResponse: async (
      modelType,
      query,
      images?,
      currentEntryID?,
      useStream?,
      showStatus?,
    ) => {
      return await models[modelType].service.getResponse({
        query,
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
    getCurrentHistory: () => {
      return historyManager.getCurrentHistory();
    },
    addNewConversationHistory: async () => {
      return await historyManager.addNewConversationHistory();
    },
    editLanguageModelConversationHistory: (entryID, newMessage) => {
      historyManager.editConversationEntry(entryID, newMessage);
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
    getHistories: () => {
      return historyManager.getHistories();
    },
    switchHistory: (historyID) => {
      historyManager.switchHistory(historyID);
    },
    deleteHistory: async (historyID) => {
      return await historyManager.deleteHistory(historyID);
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
    updateHistoryTitleById: (historyID, title) => {
      historyManager.updateHistoryTitleById(historyID, title);
    },
    addHistoryTag: (historyID, tag) => {
      historyManager.addTagToHistory(historyID, tag);
    },
    removeHistoryTag: (historyID, tag) => {
      historyManager.removeTagFromHistory(historyID, tag);
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
    openExtensionMarketplace: async (extensionId) => {
      await vscode.commands.executeCommand(
        'workbench.extensions.search',
        extensionId,
      );
    },
    insertCode: async (code: string) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('Failed to find editor');
        return;
      }

      await editor.edit((editBuilder) => {
        const position = editor.selection.active;
        editBuilder.insert(position, code);
      });
    },
    // 獲取當前編輯器的程式碼
    getCurrentEditorCode: async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('未能找到編輯器');
        return '';
      }
      return editor.document.getText();
    },
    // 呼叫 CodeFixerService 來比較程式碼
    fixCode: async (options) => {
      const response = await geminiCodeFixerService.getResponse(options);
      return response;
    },

    showDiffInEditor, // 顯示差異 API
    clearDecorations, // 清除裝飾 API
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
  vscode.commands.registerCommand('diff.file', Commands.file);

  // 當檔案內容變更時自動清除裝飾
  vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (editor && event.document === editor.document) {
      vscode.commands.executeCommand('extension.clearDecorations');
    }
  });

  // 當切換編輯器時自動清除裝飾
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      vscode.commands.executeCommand('extension.clearDecorations');
    }
  });
};

export const deactivate = () => {
  return;
};
