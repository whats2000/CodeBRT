import * as vscode from 'vscode';

import { AutoCodeCompletionProvider } from './autoCodeCompletion';
import { ManuallyCodeCompletionProvider } from './manuallyCodeCompletion';
import { SettingsManager } from '../../api';

export class InlineCompletionProvider
  implements vscode.InlineCompletionItemProvider
{
  private readonly autoCodeCompletionProvider: AutoCodeCompletionProvider;
  private readonly manuallyCodeCompletionProvider: ManuallyCodeCompletionProvider;

  constructor(
    extensionContext: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    this.autoCodeCompletionProvider = new AutoCodeCompletionProvider(
      extensionContext,
      settingsManager,
    );
    this.manuallyCodeCompletionProvider = new ManuallyCodeCompletionProvider(
      extensionContext,
      settingsManager,
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
        context,
        token,
      );
    } else if (
      context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic
    ) {
      return await this.autoCodeCompletionProvider.provideCompletionItems(
        document,
        position,
        context,
        token,
      );
    }

    return null;
  }
}
