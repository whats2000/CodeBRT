import * as vscode from 'vscode';

import type { ToolResponseFromToolFunction, ToolServicesApi } from './types';
import path from 'path';

/**
 * Execute a system command using the terminal manager.
 * Requires an open workspace folder.
 *
 * @param options Configuration for command execution
 * @returns Execution result with status and output
 */
export const executeCommandTool: ToolServicesApi['executeCommand'] = async ({
  command,
  relativePath,
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

  const commandWithRelativePath = !relativePath
    ? workspaceFolders.uri.fsPath
    : path.resolve(workspaceFolders.uri.fsPath, relativePath);

  try {
    updateStatus?.(`[processing] Executing command: ${command}`);

    const terminalInfo = await terminalManager.getOrCreateTerminal(
      commandWithRelativePath,
    );
    terminalInfo.terminal.show();

    let output = '';
    let hasError = false;
    let timedOut = false;
    let isTerminalClosed = false;

    const process = terminalManager.runCommand(terminalInfo, command);

    // Listen for terminal closure
    const terminalClosedListener = vscode.window.onDidCloseTerminal(
      (closedTerminal) => {
        if (closedTerminal === terminalInfo.terminal) {
          isTerminalClosed = true;
          clearTimeout(commandTimeout);
          process.terminate();
        }
      },
    );

    const commandTimeout = setTimeout(async () => {
      if (!isTerminalClosed) {
        timedOut = true;
        const userChoice = await vscode.window.showInformationMessage(
          'The command is taking longer than expected. Would you like to extend the timeout?',
          'Yes, extend by 20 seconds',
          'Stop the command',
        );

        if (userChoice === 'Yes, extend by 20 seconds') {
          timedOut = false;
          setTimeout(() => commandTimeout, 20000); // extend by 20 seconds
        } else {
          terminalInfo.terminal.sendText('\x03'); // Stop command
        }
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

    // Clean up
    clearTimeout(commandTimeout);
    terminalClosedListener.dispose();

    await new Promise((resolve) => setTimeout(resolve, 50));

    let result = '';

    if (timedOut) {
      result += `Command timed out after ${timeoutDuration}ms.\n`;
    }
    if (hasError) {
      result +=
        'Something went wrong while executing the command. Please check the command and try again.\n';
    }
    if (isTerminalClosed) {
      result +=
        'The terminal was closed by the user before the command completed.\n';
    }
    if (output.trim() !== '') {
      // If you have multiple lines of \n, we narrow it down to only 1 line
      const formattedOutput = output
        .trim()
        .replace(/\n{2,}/g, '\n')
        .replace('\u001b', '');
      result += 'With output:\n' + formattedOutput;
    } else {
      result += 'Without any output.';
    }

    return {
      status: hasError || isTerminalClosed ? 'error' : 'success',
      result: result,
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
