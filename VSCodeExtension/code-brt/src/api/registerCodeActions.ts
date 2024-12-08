import vscode from 'vscode';

import { triggerEvent } from './registerView';

export const registerCodeActions = () => {
  vscode.languages.registerCodeActionsProvider('*', {
    provideCodeActions(
      _document: vscode.TextDocument,
      _range: vscode.Range,
      _context: vscode.CodeActionContext,
      _token: vscode.CancellationToken,
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
      const sendCodeToChatAction = new vscode.CodeAction(
        'Refers to CodeBRT Chat',
        vscode.CodeActionKind.QuickFix,
      );
      sendCodeToChatAction.command = {
        command: 'code-brt.sendCodeToChat',
        title: 'Send code to chat',
      };
      sendCodeToChatAction.isPreferred = true;
      return [sendCodeToChatAction];
    },
  });

  vscode.commands.registerCommand('code-brt.sendCodeToChat', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    const document = editor.document;
    const codeText = editor.document.getText(editor.selection);
    // Because the line number is 0-based, we need to add 1 to the line number
    const startLine = editor.selection.start.line + 1;
    const endLine = editor.selection.end.line + 1;
    const codeLanguage = document.languageId;
    const relativePath = vscode.workspace.asRelativePath(document.fileName);

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
  });
};
