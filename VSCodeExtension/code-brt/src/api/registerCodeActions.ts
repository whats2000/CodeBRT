import vscode from 'vscode';

import type { ViewApi } from './viewApi/types';

export const registerCodeActions = (api: ViewApi) => {
  vscode.languages.registerCodeActionsProvider('javascript', {
    provideCodeActions(
      document: vscode.TextDocument,
      range: vscode.Range,
      _context: vscode.CodeActionContext,
      _token: vscode.CancellationToken,
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
      const fixCodeAction = new vscode.CodeAction(
        'Quick Fix Code',
        vscode.CodeActionKind.QuickFix,
      );
      fixCodeAction.command = {
        title: 'Send to Chat',
        command: 'code-brt.fixCode',
        arguments: [document.getText(range)],
      };
      return [fixCodeAction];
    },
  });

  vscode.commands.registerCommand('code-brt.fixCode', (selectedCode) => {
    if (selectedCode) {
      api.insertSelectedCodeToChat();
    }
  });
};
