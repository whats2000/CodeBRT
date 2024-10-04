import * as vscode from 'vscode';

export abstract class AbstractCompletionProvider {
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
