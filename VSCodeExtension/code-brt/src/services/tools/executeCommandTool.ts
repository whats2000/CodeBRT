import * as vscode from 'vscode';

import type { ToolResponseFromToolFunction, ToolServicesApi } from './types';

/**
 * Execute a system command using the terminal manager.
 * Requires an open workspace folder.
 *
 * @param options Configuration for command execution
 * @returns Execution result with status and output
 */
export const executeCommandTool: ToolServicesApi['executeCommand'] = async ({
  command,
  updateStatus,
  terminalManager,
}): Promise<ToolResponseFromToolFunction> => {
  // Check workspace
  const workspaceFolders = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolders) {
    return {
      status: 'error',
      result:
        'No workspace folders found. Please open a workspace before executing commands.',
    };
  }

  if (!command || command.trim() === '') {
    return {
      status: 'error',
      result: 'No command provided. Please specify a valid command to execute.',
    };
  }

  try {
    updateStatus?.(`[processing] Executing command: ${command}`);

    const terminalInfo = await terminalManager.getOrCreateTerminal(
      workspaceFolders.uri.fsPath,
    );
    terminalInfo.terminal.show();

    let output = '';
    let hasError = false;

    const process = terminalManager.runCommand(terminalInfo, command);

    process.on('line', (line) => {
      output += line + '\n';
      updateStatus?.(`[processing] Command output: ${line}`);
    });

    process.on('error', () => {
      hasError = true;
    });

    process.once('no_shell_integration', async () => {
      await vscode.window.showWarningMessage(
        'Shell integration is not available for the terminal.',
      );
    });

    await process;

    // Delay to ensure the terminal has time to process the output
    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      status: hasError ? 'error' : 'success',
      result:
        output.trim() || hasError
          ? 'Something went wrong'
          : 'Execution successful',
    };
  } catch (error) {
    console.error('Command execution completely failed:', error);

    return {
      status: 'error',
      result: `Execution failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  } finally {
    updateStatus?.('');
  }
};
