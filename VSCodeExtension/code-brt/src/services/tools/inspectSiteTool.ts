import vscode from 'vscode';

import type { ToolServicesApi } from './types';
import { BrowserIntegrationFactory } from '../../integrations/browser/browserIntegrationFactory';

export const inspectSiteTool: ToolServicesApi['inspectSite'] = async ({
  url,
  updateStatus,
}) => {
  try {
    updateStatus?.('[processing] Starting browser inspection...');

    // Create a browser service
    const browserService =
      await BrowserIntegrationFactory.createBrowserIntegration();

    // Check the URL
    const result = await browserService.inspect(url);

    // Close the browser
    await browserService.close();

    updateStatus?.('');

    // Convert the screenshot to a base64 string
    const screenshot = result.screenshot?.toString('base64');
    let screenshotPath: string | undefined;

    if (screenshot) {
      // Save the screenshot to the file system
      const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (workspacePath) {
        screenshotPath = `${workspacePath}/.vscode/screenshot.png`;

        // If the .vscode directory doesn't exist, create it
        await vscode.workspace.fs.createDirectory(
          vscode.Uri.file(`${workspacePath}/.vscode`),
        );

        // Write the screenshot to the file system
        await vscode.workspace.fs.writeFile(
          vscode.Uri.file(screenshotPath),
          Buffer.from(screenshot, 'base64'),
        );

        // Preview the screenshot
        await vscode.commands.executeCommand(
          'vscode.open',
          vscode.Uri.file(screenshotPath),
        );
      }
    }

    // Return the inspection result
    return {
      status: 'success',
      // TODO: Add the image back to the tool result
      images: screenshotPath ? [screenshotPath] : undefined,
      result:
        `Website Inspection Results:\n` +
        `URL: ${result.pageUrl}\n` +
        `Console Messages:\n${result.consoleMessages.join('\n')}`,
    };
  } catch (error) {
    updateStatus?.('');
    console.log(error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      result: `Error inspecting site: ${errorMessage}`,
    };
  }
};
