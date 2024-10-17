import * as vscode from 'vscode';

export interface CompletionStrategy {
  provideCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<vscode.InlineCompletionItem[] | null>;
}

export * from './manuallyCodeCompletionStrategy';
