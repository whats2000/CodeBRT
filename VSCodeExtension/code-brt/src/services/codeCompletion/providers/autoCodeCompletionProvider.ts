import vscode from 'vscode';

import type { LoadedModelServices } from 'src/types';
import { AbstractCompletionProvider } from '../base';
import { SettingsManager } from '../../../api';
import { StatusBarManager } from '../ui/statusBarManager';

// TODO: Implement the AutoCodeCompletionProvider class
export class AutoCodeCompletionProvider implements AbstractCompletionProvider {
  constructor(
    _ctx: vscode.ExtensionContext,
    _settingsManager: SettingsManager,
    _loadedModelServices: LoadedModelServices,
    _statusBarManager: StatusBarManager,
  ) {}

  provideCompletionItems(
    _document: vscode.TextDocument,
    _position: vscode.Position,
    _token: vscode.CancellationToken,
  ): Promise<
    vscode.InlineCompletionItem[] | vscode.InlineCompletionList | null
  > {
    return Promise.resolve(null);
  }
}
