import vscode from 'vscode';

import { triggerEvent } from './registerView';

export const registerCodeActions = () => {
  vscode.languages.registerCodeActionsProvider('*', {
    provideCodeActions(
      document: vscode.TextDocument,
      range: vscode.Range,
      _context: vscode.CodeActionContext,
      _token: vscode.CancellationToken,
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
      const sendCodeToChatAction = new vscode.CodeAction(
        'Refers to CodeBRT Chat',
        vscode.CodeActionKind.QuickFix,
      );
      const relativePath = vscode.workspace.asRelativePath(document.fileName);
      sendCodeToChatAction.command = {
        title: 'Refers to CodeBRT Chat',
        command: 'code-brt.sendCodeToChat',
        arguments: [
          document.getText(range),
          range.start.line,
          range.end.line,
          document.languageId,
          relativePath,
        ],
      };
      return [sendCodeToChatAction];
    },
  });

  vscode.commands.registerCommand(
    'code-brt.sendCodeToChat',
    (
      codeText: string,
      startLine: number,
      endLine: number,
      codeLanguage: string,
      relativePath: string,
    ) => {
      if (codeText) {
        triggerEvent('sendCodeToChat', {
          id: Date.now().toString(),
          codeText,
          startLine,
          endLine,
          codeLanguage,
          relativePath,
        });
      }
    },
  );
};
