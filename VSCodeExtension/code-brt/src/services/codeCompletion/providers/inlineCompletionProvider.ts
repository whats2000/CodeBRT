import * as vscode from 'vscode';

import { AutoCodeCompletionProvider } from './autoCodeCompletionProvider';
import { ManuallyCodeCompletionProvider } from './manuallyCodeCompletionProvider';
import { SettingsManager } from '../../../api';
import { LoadedModelServices } from '../../../types';
import { StatusBarManager } from '../ui/statusBarManager';

export class InlineCompletionProvider
  implements vscode.InlineCompletionItemProvider
{
  private readonly autoCodeCompletionProvider: AutoCodeCompletionProvider;
  private readonly manuallyCodeCompletionProvider: ManuallyCodeCompletionProvider;

  constructor(
    ctx: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    loadedModelServices: LoadedModelServices,
    statusBarManager: StatusBarManager,
  ) {
    this.autoCodeCompletionProvider = new AutoCodeCompletionProvider(
      ctx,
      settingsManager,
      loadedModelServices,
      statusBarManager,
    );
    this.manuallyCodeCompletionProvider = new ManuallyCodeCompletionProvider(
      ctx,
      settingsManager,
      loadedModelServices,
      statusBarManager,
    );
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
  ): Promise<
    vscode.InlineCompletionItem[] | vscode.InlineCompletionList | null
  > {
    if (context.triggerKind === vscode.InlineCompletionTriggerKind.Invoke) {
      return await this.manuallyCodeCompletionProvider.provideCompletionItems(
        document,
        position,
        token,
      );
    } else if (
      context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic
    ) {
      return await this.autoCodeCompletionProvider.provideCompletionItems(
        document,
        position,
        token,
      );
    }

    return null;
  }
}
