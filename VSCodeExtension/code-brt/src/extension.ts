import * as vscode from 'vscode';

import {
  AVAILABLE_MODEL_SERVICES,
  AVAILABLE_VOICE_SERVICES,
} from './constants';
import {
  connectedViews,
  HistoryManager,
  registerAndConnectView,
  registerInlineCompletion,
  SettingsManager,
} from './api';
import { ModelServiceFactory } from './services/languageModel';
import { VoiceServiceFactory } from './services/voice';
import { TerminalManager } from './integrations';
import { createViewApi } from './api/viewApi/viewApiFactory';

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
  const api = createViewApi(
    ctx,
    settingsManager,
    historyManager,
    terminalManager,
    models,
    voiceServices,
    connectedViews,
  );

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
