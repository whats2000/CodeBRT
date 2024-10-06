import * as vscode from 'vscode';

import type { LoadedModelServices } from '../../../types';
import { AbstractCompletionProvider } from '../base';
import { SettingsManager } from '../../../api';
import { AutoCodeCompletionStrategy } from '../strategies';

export class AutoCodeCompletionProvider implements AbstractCompletionProvider {
  private readonly completionStrategy: AutoCodeCompletionStrategy;

  constructor(
    ctx: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    loadedModelServices: LoadedModelServices,
  ) {
    this.completionStrategy = new AutoCodeCompletionStrategy(
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
    try {
      const completions = await this.completionStrategy.provideCompletion(
        document,
        position,
        token,
      );

      if (!completions || completions.length === 0) {
        return null;
      }

      return new vscode.InlineCompletionList(completions);
    } catch (error) {
      console.error('Error in auto code completion:', error);
      return null;
    }
  }
}
