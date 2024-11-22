import path from 'path';

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
  relativePath,
  timeoutDuration = 5000,
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
    let isTerminalClosed = false;
    let completed = false;

    const process = terminalManager.runCommand(terminalInfo, command);

    // Listen for terminal closure
    const terminalClosedListener = vscode.window.onDidCloseTerminal(
      (closedTerminal) => {
        if (closedTerminal === terminalInfo.terminal) {
          isTerminalClosed = true;
          process.terminate();
        }
      },
    );

    // Set up timeout handling
    const commandTimeout = setTimeout(async () => {
      if (!isTerminalClosed && !completed) {
        const userChoice = await vscode.window.showInformationMessage(
          'The command is taking longer than expected. Would you like to continue the chat while the command runs?',
          'Continue',
          'Stop the command',
        );

        if (userChoice === 'Stop the command') {
          terminalInfo.terminal.sendText('\x03'); // Sends Ctrl+C to stop the command
          process.terminate();
        } else {
          // Let the process continue in the background
          process.continue();
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

    process.once('completed', () => {
      completed = true;
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

    // Allow time for final output processing
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Format output
    const formattedOutput = output
      .trim()
      .replace(/\n{2,}/g, '\n')
      .replace('\u001b', '');

    // Prepare the result message
    let result = '';

    if (isTerminalClosed) {
      result +=
        'The terminal was closed by the user before the command completed.\n';
    } else if (hasError) {
      result +=
        'Something went wrong while executing the command. Please check the command and try again.\n';
    }

    if (formattedOutput) {
      result += completed
        ? 'Execution is completed with the following output:\n' +
          formattedOutput
        : 'Execution still running in the terminal. Here is the output so far:\n' +
          formattedOutput;
    } else if (!isTerminalClosed && !hasError && completed) {
      result += 'Execution completed successfully without output.';
    }

    return {
      status: isTerminalClosed || hasError ? 'error' : 'success',
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
