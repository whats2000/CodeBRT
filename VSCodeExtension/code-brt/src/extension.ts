import * as vscode from 'vscode';

import type { GetLanguageModelResponseParams, ViewApi } from './types';
import {
  AVAILABLE_MODEL_SERVICES,
  AVAILABLE_VOICE_SERVICES,
} from './constants';
import { FileOperationsProvider } from './utils';
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
import { ToolServiceProvider } from './services/tools';
import { TerminalManager } from './integrations';
import { OpenaiCodeFixerService } from './services/codeFixer';
import { DecorationController } from './views/components/common/DecorationController';
import { DiffViewProvider } from './views/components/common/DiffViewProvider';

let extensionContext: vscode.ExtensionContext | undefined = undefined;

export const activate = async (ctx: vscode.ExtensionContext) => {
  extensionContext = ctx;
  const settingsManager = SettingsManager.getInstance(ctx);
  const historyManager = new HistoryManager(ctx);
  const terminalManager = new TerminalManager();
  const openaiCodeFixerService = new OpenaiCodeFixerService(
    ctx,
    settingsManager,
  );

  // Create a model service factory instance
  const modelServiceFactory = new ModelServiceFactory(ctx, settingsManager);
  const models = modelServiceFactory.createModelServices(
    AVAILABLE_MODEL_SERVICES,
  );
  const voiceServiceFactory = new VoiceServiceFactory(ctx, settingsManager);
  const voiceServices = voiceServiceFactory.createVoiceServices(
    AVAILABLE_VOICE_SERVICES,
  );
  const diffViewProvider = new DiffViewProvider(ctx.extensionPath);

  /**
   * Register and connect views to the extension
   * This uses for communication messages channel
   */
  const api: ViewApi = {
    setSettingByKey: async (key, value) => {
      await settingsManager.set(key, value);
    },
    getSettingByKey: (key) => {
      return settingsManager.get(key);
    },
    getAllSettings: async () => {
      return await settingsManager.getAllSettings();
    },
    alertMessage: async (msg, type, selections) => {
      const showFunction = {
        info: vscode.window.showInformationMessage,
        warning: vscode.window.showWarningMessage,
        error: vscode.window.showErrorMessage,
      }[type];

      const selectionOptions = selections?.map((selection) => selection.text);
      if (selectionOptions) {
        await showFunction(msg, ...selectionOptions).then((selection) => {
          if (!selection) {
            return;
          }
          const commandArgs = selections?.find(
            (s) => s.text === selection,
          )?.commandArgs;
          if (!commandArgs || commandArgs.length === 0) {
            return;
          }
          vscode.commands.executeCommand(
            commandArgs[0],
            ...commandArgs.slice(1),
          );
        });
      }
    },
    getLanguageModelResponse: async (
      options: GetLanguageModelResponseParams,
    ) => {
      return await models[options.modelServiceType].service.getResponse({
        ...options,
        historyManager,
        sendStreamResponse: options.useStream
          ? (msg) => {
              triggerEvent('streamResponse', msg);
            }
          : undefined,
        updateStatus: options.showStatus
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
      return FileOperationsProvider.uploadFile(
        ctx,
        base64Data,
        originalFileName,
      );
    },
    deleteFile: FileOperationsProvider.deleteFile,
    getWebviewUri: async (absolutePath: string) => {
      return await FileOperationsProvider.getWebviewUri(
        ctx,
        connectedViews,
        absolutePath,
      );
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
      return await ToolServiceProvider.executeToolCall(
        toolCall,
        terminalManager,
        (status) => {
          triggerEvent('updateStatus', status);
        },
      );
    },
    continueWithToolCallResponse: async (_entry) => {},
    getCurrentEditorCode: async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('Failed to find editor');
        return '';
      }
      return editor.document.getText();
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
    fixCode: async (options) => {
      return await openaiCodeFixerService.getResponse(options);
    },
    insertSelectedCodeToChat: async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('Failed to find editor');
        return;
      }

      const selectedText = editor.document.getText(editor.selection);
      if (!selectedText) {
        vscode.window.showErrorMessage('No code selected');
        return;
      }

      Object.values(connectedViews).forEach((view) => {
        view?.webview.postMessage({
          type: 'message',
          text: selectedText,
        });
      });

      vscode.window.showInformationMessage(
        `Selected code sent to chat: ${selectedText}`,
      );
    },
    applyDecorations: async (modifications: Modification[]) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('Editor not found');
        return;
      }

      const additionController = new DecorationController(
        'fadedOverlay',
        editor,
      );
      const deletionController = new DecorationController('activeLine', editor);

      // Clear any existing decorations
      additionController.clear();
      deletionController.clear();

      modifications.forEach((mod) => {
        if (mod.content !== '') {
          additionController.addLines(
            mod.startLine - 1,
            mod.endLine - mod.startLine + 1,
          );
        } else {
          deletionController.addLines(
            mod.startLine - 1,
            mod.endLine - mod.startLine + 1,
          );
        }
      });

      vscode.window.showInformationMessage('Decorations applied successfully.');
    },
    getEditorInfo: async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('Editor not found');
        return null;
      }

      const document = editor.document;
      const firstLine = document.lineAt(0);
      return {
        startingLine: firstLine.lineNumber + 1,
      };
    },
    showFullDiffInEditor: async ({ originalCode, modifiedCode }) => {
      await diffViewProvider.showDiffInEditor(originalCode, modifiedCode);
    },
    applyCodeChanges: async (
      modifications: Modification[],
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        if (!modifications || modifications.length === 0) {
          throw new Error(
            'No modifications provided for applying code changes.',
          );
        }

        // 确保 `diffViewProvider` 的内容状态是最新的
        if (!diffViewProvider.getOriginalContent()) {
          // 如果原始内容未设置，则尝试获取活动编辑器的内容
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            const originalContent = editor.document.getText();
            diffViewProvider.setOriginalContent(originalContent);
            diffViewProvider.setOriginalDocumentUri(editor.document.uri);
          } else {
            throw new Error(
              'No active editor found to retrieve original content.',
            );
          }
        }

        // 将 `Modification[]` 转换为新的内容
        let updatedContent = diffViewProvider.getOriginalContent();
        modifications.forEach((mod) => {
          const lines = updatedContent.split('\n');
          if (mod.content === '') {
            // 删除指定范围内的行
            lines.splice(mod.startLine - 1, mod.endLine - mod.startLine + 1);
          } else {
            // 插入或替换指定行
            lines.splice(mod.startLine - 1, 0, mod.content);
          }
          updatedContent = lines.join('\n');
        });

        // 使用合并后的字符串更新内容
        await diffViewProvider.updateContent(updatedContent);
        const result = await diffViewProvider.applyChanges(); // 直接在当前文件中应用变更
        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    revertTemporaryInsertions: async () => {
      await diffViewProvider.revertChanges();
    },
    closeActiveEditor: async () => {
      await vscode.commands.executeCommand(
        'workbench.action.closeActiveEditor',
      );
    },
  };

  void registerAndConnectView(ctx, settingsManager, 'chatActivityBar', api);
  void registerAndConnectView(ctx, settingsManager, 'workPanel', api);
  vscode.languages.registerCodeActionsProvider('javascript', {
    provideCodeActions(
      document: vscode.TextDocument,
      range: vscode.Range,
      _context: vscode.CodeActionContext,
      _token: vscode.CancellationToken,
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
      const fixCodeAction = new vscode.CodeAction(
        'Quick Fix Code',
        vscode.CodeActionKind.QuickFix,
      );
      fixCodeAction.command = {
        title: 'Send to Chat',
        command: 'code-brt.fixCode',
        arguments: [document.getText(range)],
      };
      return [fixCodeAction];
    },
  });

  vscode.commands.registerCommand('code-brt.fixCode', (selectedCode) => {
    if (selectedCode) {
      api.insertSelectedCodeToChat();
    }
  });
  registerInlineCompletion(ctx, settingsManager, connectedViews);
};

export const deactivate = () => {
  extensionContext?.subscriptions?.forEach((sub) => sub.dispose());
};
