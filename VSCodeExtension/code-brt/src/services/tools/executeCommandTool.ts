import * as vscode from 'vscode';

import type { ToolResponseFromToolFunction, ToolServicesApi } from './types';

let output = '';

/**
 * Execute a system command using the terminal manager.
 * Requires an open workspace folder.
 *
 * @param options Configuration for command execution
 * @returns Execution result with status and output
 */
export const executeCommandTool: ToolServicesApi['executeCommand'] = async ({
  command,
  timeoutDuration = 10000,
  updateStatus,
  terminalManager,
}): Promise<ToolResponseFromToolFunction> => {
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

    output = '';
    let hasError = false;
    let timedOut = false;

    const process = terminalManager.runCommand(terminalInfo, command);

    const commandTimeout = setTimeout(async () => {
      timedOut = true;
      const userChoice = await vscode.window.showInformationMessage(
        'The command is taking longer than expected. Would you like to extend the timeout?',
        'Yes, extend by 20 seconds',
        'Stop the command',
      );

      if (userChoice === 'Yes, extend by 20 seconds') {
        // Extend timeout by another minute
        timedOut = false;
        setTimeout(() => commandTimeout, 20);
      } else {
        // Stop the command by sending an interrupt signal
        terminalInfo.terminal.sendText('\x03');
      }
    }, timeoutDuration);

    process.on('line', (line) => {
      output += line + '\n';
      updateStatus?.(`[processing] Command output: ${line}`);
    });

    process.on('error', () => {
      hasError = true;
      clearTimeout(commandTimeout);
    });

    process.once('no_shell_integration', async () => {
      await vscode.window.showWarningMessage(
        'Shell integration is not available for the terminal.',
      );
    });

    await process;

    // Clear timeout on successful completion
    clearTimeout(commandTimeout);

    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      status: hasError ? 'error' : 'success',
      result:
        (timedOut
          ? `Command timed out after ${timeoutDuration}ms. With output:\n${output.trim()}`
          : output.trim()) ||
        (hasError
          ? 'Something went wrong. Please try running the command manually for more context.'
          : timedOut
            ? 'The command is still pending.'
            : 'Execution successful.'),
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
