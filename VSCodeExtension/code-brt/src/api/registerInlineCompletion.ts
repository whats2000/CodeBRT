import * as vscode from 'vscode';

import { AVAILABLE_MODEL_SERVICES } from '../constants';
import {
  InlineCompletionProvider,
  SUPPORTED_LANGUAGES,
} from '../services/codeCompletion';
import { SettingsManager } from './settingsManager';
import { ModelServiceFactory } from '../services/languageModel';

export const registerInlineCompletion = (
  ctx: vscode.ExtensionContext,
  settingsManager: SettingsManager,
) => {
  const codeCompletionModelServiceFactory = new ModelServiceFactory(
    ctx,
    settingsManager,
  );

  const codeCompletionModels =
    codeCompletionModelServiceFactory.createModelServices(
      AVAILABLE_MODEL_SERVICES,
    );

  // Activate manually complete functionality
  const completionProvider = new InlineCompletionProvider(
    ctx,
    settingsManager,
    codeCompletionModels,
  );

  // Keep the inline completion provider registration
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
};
