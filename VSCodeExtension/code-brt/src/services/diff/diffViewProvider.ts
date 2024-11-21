import * as vscode from 'vscode';
import * as path from 'path';

export class DiffViewProvider {
  static async showDiff(
    filePath: string,
    originalContent: string,
    newContent: string
  ) {
    const originalUri = vscode.Uri.parse(`diff:Original/${path.basename(filePath)}`);
    const modifiedUri = vscode.Uri.parse(`diff:Modified/${path.basename(filePath)}`);

    const contentProvider = new (class implements vscode.TextDocumentContentProvider {
      provideTextDocumentContent(uri: vscode.Uri): string {
        if (uri.toString() === originalUri.toString()) {
          return originalContent;
        }
        if (uri.toString() === modifiedUri.toString()) {
          return newContent;
        }
        return '';
      }
    })();

    vscode.workspace.registerTextDocumentContentProvider('diff', contentProvider);

    await vscode.commands.executeCommand(
      'vscode.diff',
      originalUri,
      modifiedUri,
      `Diff: ${path.basename(filePath)}`
    );
  }

  static async closeDiff() {
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  }
}
