import vscode from 'vscode';

export type CompletionStrategy = {
  provideCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<vscode.InlineCompletionItem[] | null>;
};
