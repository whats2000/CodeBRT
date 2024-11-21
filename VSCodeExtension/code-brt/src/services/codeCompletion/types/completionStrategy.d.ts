import vscode from 'vscode';

import type { ModelServiceType } from '../../../types';

export type CompletionStrategy = {
  provideCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    modelService: ModelServiceType,
    modelName: string,
  ): Promise<vscode.InlineCompletionItem[] | null>;
};
