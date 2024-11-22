import vscode from 'vscode';

import { DiffIntegration } from '../../integrations';

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
  );
};
