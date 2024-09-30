import * as vscode from 'vscode';

import type {
  LoadedModelServices,
  LoadedVoiceServices,
  Modification,
  ViewApi,
  ViewApiError,
  ViewApiEvent,
  ViewApiRequest,
  ViewApiResponse,
  ViewEvents,
} from './types';
import { FileUtils } from './utils';
import { ViewKey } from './views';
import { HistoryManager, SettingsManager, viewRegistration } from './api';
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
import { GeminiCodeFixerService } from './services/codeFixer';
import { convertPdfToMarkdown } from './utils/pdfConverter';

import * as Commands from './diff/commands';

let originalContentSnapshot: string | null = null;
let addedDecorationType: vscode.TextEditorDecorationType | null = null;
let removedDecorationType: vscode.TextEditorDecorationType | null = null;

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
    openExtensionMarketplace: async (extensionId) => {
      await vscode.commands.executeCommand(
        'workbench.extensions.search',
        extensionId,
      );
    },
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
      return await geminiCodeFixerService.getResponse(options);
    },
    showDiffInEditor: async (
      modifications: Modification[],
    ): Promise<Modification[]> => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('Editor not found');
        return [];
      }
      addedDecorationType = vscode.window.createTextEditorDecorationType({
        isWholeLine: true,
        backgroundColor: 'rgba(144,238,144,0.5)',
      });

      removedDecorationType = vscode.window.createTextEditorDecorationType({
        isWholeLine: true,
        backgroundColor: 'rgba(255,99,71,0.5)',
      });

      const addedRanges: vscode.DecorationOptions[] = [];
      const removedRanges: vscode.DecorationOptions[] = [];

      let offset = 0;
      const updatedModifications: Modification[] = [];

      for (const mod of modifications) {
        if (mod.content !== '') {
          const newStart = new vscode.Position(mod.startLine - 1 + offset, 0);
          addedRanges.push({
            range: new vscode.Range(newStart, newStart),
          });

          await editor.edit((editBuilder) => {
            editBuilder.insert(newStart, mod.content + '\n');
          });

          const insertedLines = mod.content.split('\n').length;
          offset += insertedLines;

          updatedModifications.push({
            ...mod,
            startLine: mod.startLine + offset,
            endLine: mod.endLine + offset,
          });
        }
      }

      for (const mod of modifications) {
        if (mod.content === '') {
          const start = new vscode.Position(mod.startLine - 1 + offset, 0);
          const end = new vscode.Position(
            mod.endLine - 1 + offset,
            editor.document.lineAt(mod.endLine - 1).range.end.character,
          );
          removedRanges.push({ range: new vscode.Range(start, end) });

          updatedModifications.push({
            startLine: mod.startLine + offset,
            endLine: mod.endLine + offset,
            content: mod.content,
          });
        }
      }

      editor.setDecorations(addedDecorationType, addedRanges);
      editor.setDecorations(removedDecorationType, removedRanges);

      return updatedModifications;
    },

    applyCodeChanges: async (modifications: Modification[]) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('Editor not found');
        return;
      }

      let offset = 0;

      await editor.edit((editBuilder) => {
        modifications.forEach((mod) => {
          if (mod.content === '') {
            const startLine = mod.startLine - 1 + offset;
            const endLine = mod.endLine - 1 + offset;

            const start = new vscode.Position(startLine, 0);
            const end = new vscode.Position(
              endLine,
              editor.document.lineAt(endLine).range.end.character,
            );

            editBuilder.delete(new vscode.Range(start, end));

            const deletedLines = mod.endLine - mod.startLine + 1;
            offset -= deletedLines;
          }
        });
      });

      await editor.edit((editBuilder) => {
        modifications.forEach((mod) => {
          if (mod.content !== '') {
            const newStart = new vscode.Position(mod.startLine - 1 + offset, 0);
            editBuilder.insert(newStart, mod.content + '\n');

            const insertedLines = mod.content.split('\n').length;
            offset += insertedLines;
          }
        });
      });

      await editor.edit((editBuilder) => {
        for (let lineNum = 0; lineNum < editor.document.lineCount; lineNum++) {
          const lineText = editor.document.lineAt(lineNum).text;
          if (lineText.trim() === '') {
            const start = new vscode.Position(lineNum, 0);
            const end = new vscode.Position(lineNum + 1, 0);
            editBuilder.delete(new vscode.Range(start, end));
          }
        }
      });

      const backgroundColor = new vscode.ThemeColor('editor.background');

      const invisibleDecorationType =
        vscode.window.createTextEditorDecorationType({
          isWholeLine: true,
          backgroundColor: backgroundColor,
        });

      editor.setDecorations(invisibleDecorationType, []);

      vscode.window.showInformationMessage(
        'Code changes applied successfully.',
      );
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
        view.webview.postMessage({
          type: 'message',
          text: selectedText,
        });
      });

      vscode.window.showInformationMessage(
        `Selected code sent to chat: ${selectedText}`,
      );
    },
    updateDecorationToMatchBackground: async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('Editor not found');
        return;
      }

      const editorBackgroundColor = new vscode.ThemeColor('editor.background');

      const emptyDecorationType = vscode.window.createTextEditorDecorationType(
        {},
      );

      const addedDecoration = addedDecorationType || emptyDecorationType;
      const removedDecoration = removedDecorationType || emptyDecorationType;

      editor.setDecorations(addedDecoration, []);
      editor.setDecorations(removedDecoration, []);

      const neutralDecorationType =
        vscode.window.createTextEditorDecorationType({
          isWholeLine: true,
          backgroundColor: editorBackgroundColor,
        });

      editor.setDecorations(neutralDecorationType, []);
    },
    revertTemporaryInsertions: async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('Editor not found');
        return;
      }

      if (originalContentSnapshot === null) {
        vscode.window.showErrorMessage('No original content snapshot found.');
        return;
      }

      await editor.edit((editBuilder) => {
        const entireRange = new vscode.Range(
          editor.document.positionAt(0),
          editor.document.positionAt(editor.document.getText().length),
        );
        editBuilder.replace(entireRange, originalContentSnapshot || '');
      });

      vscode.window.showInformationMessage('Temporary insertions reverted.');
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
  vscode.commands.registerCommand('code-brt.diff.file', Commands.file);
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
};

export const deactivate = () => {
  return;
};
