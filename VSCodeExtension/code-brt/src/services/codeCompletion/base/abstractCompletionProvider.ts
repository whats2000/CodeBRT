import * as vscode from 'vscode';

import { SettingsManager } from 'src/api';

export abstract class AbstractCompletionProvider {
  protected extensionContext: vscode.ExtensionContext;
  protected settingsManager: SettingsManager;

  protected constructor(
    extensionContext: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    this.extensionContext = extensionContext;
    this.settingsManager = settingsManager;
  }

  /**
   * The base class for all completion providers.
   */
  abstract provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<
    vscode.InlineCompletionItem[] | vscode.InlineCompletionList | null
  >;
}
