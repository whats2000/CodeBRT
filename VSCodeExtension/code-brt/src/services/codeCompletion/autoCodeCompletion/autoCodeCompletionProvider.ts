import vscode from 'vscode';

import { AbstractCompletionProvider } from '../abstractCompletionProvider';
import { SettingsManager } from '../../../api';

// TODO: Implement the AutoCodeCompletionProvider class
export class AutoCodeCompletionProvider extends AbstractCompletionProvider {
  constructor(
    extensionContext: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    super(extensionContext, settingsManager);
  }

  provideCompletionItems(
    _document: vscode.TextDocument,
    _position: vscode.Position,
    _context: vscode.InlineCompletionContext,
    _token: vscode.CancellationToken,
  ): Promise<
    vscode.InlineCompletionItem[] | vscode.InlineCompletionList | null
  > {
    return Promise.resolve(null);
  }
}
