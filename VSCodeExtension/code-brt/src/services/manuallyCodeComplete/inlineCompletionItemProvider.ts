// InlineCompletionProvider.ts
import * as vscode from 'vscode';

import { ManuallyCompletionProvider } from './manuallyCompletionProvider';

export class InlineCompletionProvider
  implements vscode.InlineCompletionItemProvider
{
  constructor(private completionProvider: ManuallyCompletionProvider) {}

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
  ): Promise<
    vscode.InlineCompletionItem[] | vscode.InlineCompletionList | null
  > {
    if (context.triggerKind === vscode.InlineCompletionTriggerKind.Invoke) {
      return await this.actualProvideInlineCompletionItems(
        document,
        position,
        context,
        token,
      );
    } else {
      // 对于自动触发，返回 null，不提供补全
      return null;
    }
  }

  private async actualProvideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    ctx: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
  ): Promise<vscode.InlineCompletionItem[] | vscode.InlineCompletionList> {
    console.debug('Requesting inline completions with context:', ctx);

    if (ctx.triggerKind === vscode.InlineCompletionTriggerKind.Invoke) {
      console.debug('Completion invoked.');
    } else if (
      ctx.triggerKind === vscode.InlineCompletionTriggerKind.Automatic
    ) {
      console.debug('Completion automatically triggered.');
    }

    if (ctx.selectedCompletionInfo) {
      console.debug('Selected completion info:', ctx.selectedCompletionInfo);
    }

    const compatibleContext: vscode.CompletionContext = {
      triggerKind: vscode.CompletionTriggerKind.Invoke,
      triggerCharacter: undefined,
    };

    const completionList =
      (await this.completionProvider.provideCompletionItems(
        document,
        position,
        token,
        compatibleContext,
      )) as vscode.CompletionList;

    return completionList.items
      .map((item) => {
        let insertText: string | vscode.SnippetString;
        if (typeof item.insertText === 'string') {
          insertText = item.insertText;
        } else if (item.insertText instanceof vscode.SnippetString) {
          insertText = item.insertText;
        } else if (typeof item.label === 'string') {
          insertText = item.label;
        } else if (typeof item.label === 'object' && item.label.label) {
          insertText = item.label.label;
        } else {
          console.warn(
            'Unable to determine insert text for completion item:',
            item,
          );
          return null;
        }

        return new vscode.InlineCompletionItem(
          insertText,
          new vscode.Range(
            position,
            position.translate(0, insertText.toString().length),
          ),
        );
      })
      .filter((item): item is vscode.InlineCompletionItem => item !== null);
  }
}
