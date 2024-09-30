import * as vscode from 'vscode';

import type { LoadedModelServices } from '../../../types';
import { AbstractCompletionProvider } from '../base';
import { SettingsManager } from '../../../api';
import { ManuallyCodeCompletionStrategy } from '../strategies';

export class ManuallyCodeCompletionProvider
  implements AbstractCompletionProvider
{
  private readonly completionStrategy: ManuallyCodeCompletionStrategy;

  constructor(
    ctx: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    loadedModelServices: LoadedModelServices,
  ) {
    this.completionStrategy = new ManuallyCodeCompletionStrategy(
      ctx,
      settingsManager,
      loadedModelServices,
    );
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<
    vscode.InlineCompletionItem[] | vscode.InlineCompletionList | null
  > {
    // Use the manually completion strategy to get completions
    const completions = await this.completionStrategy.provideCompletion(
      document,
      position,
      token,
    );

    // If no completions were returned, return null
    if (!completions || completions.length === 0) {
      return null;
    }

    // Return the completions as an InlineCompletionList
    return new vscode.InlineCompletionList(completions);
  }
}
