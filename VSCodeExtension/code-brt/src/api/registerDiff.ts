import vscode from 'vscode';

import { DiffIntegration } from '../integrations';

export const registerDiff = (
  ctx: vscode.ExtensionContext,
  diffIntegration: DiffIntegration,
) => {
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'code-brt.showDiff',
      async (filePath: string, originalContent: string, newContent: string) => {
        await diffIntegration.showDiff(filePath, originalContent, newContent);
      },
    ),
    vscode.commands.registerCommand('code-brt.closeDiff', async () => {
      await diffIntegration.closeDiffAndFocusModified();
    }),
    vscode.commands.registerCommand(
      'code-brt.saveFileVersion',
      async (filePath: string) => {
        diffIntegration.saveFileVersion(filePath);
      },
    ),
    vscode.commands.registerCommand(
      'code-brt.revertFileVersion',
      async (filePath: string, index?: number, dropVersion?: boolean) => {
        await diffIntegration.revertFileVersion(filePath, index, dropVersion);
      },
    ),
  );
};
