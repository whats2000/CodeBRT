import * as vscode from 'vscode';

import type { ViewKey } from '../views';
import { AVAILABLE_MODEL_SERVICES } from '../constants';
import {
  InlineCompletionProvider,
  StatusBarManager,
  SUPPORTED_LANGUAGES,
} from '../services/codeCompletion';
import { SettingsManager } from './settingsManager';
import { ModelServiceFactory } from '../services/languageModel';

export const registerInlineCompletion = (
  ctx: vscode.ExtensionContext,
  settingsManager: SettingsManager,
  connectedViews: Partial<Record<ViewKey, vscode.WebviewView>>,
) => {
  const codeCompletionModelServiceFactory = new ModelServiceFactory(
    ctx,
    settingsManager,
  );

  const statusBarManager = new StatusBarManager();

  const codeCompletionModels =
    codeCompletionModelServiceFactory.createModelServices(
      AVAILABLE_MODEL_SERVICES,
    );

  // Activate manually complete capability
  const completionProvider = new InlineCompletionProvider(
    ctx,
    settingsManager,
    codeCompletionModels,
    statusBarManager,
  );

  // Keep the inline completion provider register
  ctx.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      SUPPORTED_LANGUAGES,
      completionProvider,
    ),
  );

  ctx.subscriptions.push(
    vscode.commands.registerCommand('code-brt.triggerInlineCompletion', () => {
      void vscode.commands.executeCommand(
        'editor.action.inlineSuggest.trigger',
      );
    }),
  );

  ctx.subscriptions.push(
    vscode.commands.registerCommand('code-brt.openMainView', () => {
      connectedViews.chatActivityBar?.show();
    }),
  );

  ctx.subscriptions.push(statusBarManager);
};
