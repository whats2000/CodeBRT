// autoCodeCompletionProvider.ts

import * as vscode from 'vscode';
import { AbstractCompletionProvider } from '../base';
import { SettingsManager } from '../../../api';
import { AutoCodeCompletionStrategy } from '../strategies';
import { StatusBarManager } from '../ui/statusBarManager';
import type { LoadedModelServices } from '../../../types';

export class AutoCodeCompletionProvider implements AbstractCompletionProvider {
  private readonly completionStrategy: AutoCodeCompletionStrategy;

  constructor(
    ctx: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    loadedModelServices: LoadedModelServices,
    statusBarManager: StatusBarManager,
  ) {
    this.completionStrategy = new AutoCodeCompletionStrategy(
      ctx,
      settingsManager,
      loadedModelServices,
      statusBarManager,
    );
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<
    vscode.InlineCompletionItem[] | vscode.InlineCompletionList | null
  > {
    const completions = await this.completionStrategy.provideCompletion(
      document,
      position,
      token,
    );

    if (!completions || completions.length === 0) {
      return null;
    }

    return new vscode.InlineCompletionList(completions);
  }
}
