/**
 * This file contains code modify from repository cline, from the clinebot, which is licensed under
 * the Apache License, Version 2.0. You can obtain a copy of the Apache License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * The related file is located at:
 * https://github.com/cline/cline/blob/main/src/integrations/terminal/TerminalManager.ts
 */
import pWaitFor from 'p-wait-for';
import * as vscode from 'vscode';

import { arePathsEqual } from '../../utils/fileOperations/utils';
import {
  mergePromise,
  TerminalProcess,
  TerminalProcessResultPromise,
} from './terminalProcess';
import { TerminalInfo, TerminalRegistry } from './terminalRegistry';

/**
 * TerminalManager:
 * - Creates/reuses terminals
 * - Runs commands via runCommand(), returning a TerminalProcess
 * - Handles shell integration events
 *
 * TerminalProcess extends EventEmitter and implements Promise:
 * - Emits 'line' events with output while promise is pending
 * - process.continue() resolves promise and stops event emission
 * - Allows real-time output handling or background execution
 *
 * getUnretrievedOutput() fetches the latest output for ongoing commands
 *
 * Enables flexible command execution:
 * - Await for completion
 * - Listen to real-time events
 * - Continue execution in background
 * - Retrieve missed output later
 *
 * Notes:
 * - It turns out some shellIntegration APIs are available on cursor, although not on older versions of vscode
 * - "By default, the shell integration script should automatically activate on supported shells launched from VS Code."
 *
 * Supported shells:
 * - Linux/macOS: bash, fish, PowerShell, zsh
 * - Windows: PowerShell
 *
 * Example:
 * ```ts
 * const terminalManager = new TerminalManager(context);
 * ```
 *
 * // Run a command
 * ```ts
 * const process = terminalManager.runCommand('npm install', '/path/to/project');
 *
 * process.on('line', (line) => {
 *   console.log(line);
 * });
 * ```
 *
 * To wait for the process to complete naturally:
 * ```ts
 * await process;
 * ```
 *
 * Or to continue execution even if the command is still running
 * ```ts
 * process.continue();
 * ```
 *
 * Later, if you need to get the unretrieved output:
 * ```ts
 * const unretrievedOutput = terminalManager.getUnretrievedOutput(terminalId);
 * console.log('Unretrieved output:', unretrievedOutput);
 * ```
 *
 * Resources:
 * - https://github.com/microsoft/vscode/issues/226655
 * - https://code.visualstudio.com/updates/v1_93#_terminal-shell-integration-api
 * - https://code.visualstudio.com/docs/terminal/shell-integration
 * - https://code.visualstudio.com/api/references/vscode-api#Terminal
 * - https://github.com/microsoft/vscode-extension-samples/blob/main/terminal-sample/src/extension.ts
 * - https://github.com/microsoft/vscode-extension-samples/blob/main/shell-integration-sample/src/extension.ts
 */

/**
 * The new shellIntegration API gives us access to terminal command execution output handling.
 * However, we don't update our VSCode type definitions or
 * engine requirements to maintain compatibility with older VSCode versions.
 * Users on older versions will automatically fall back to using sendText for terminal command execution.
 * Interestingly, some environments like Cursor enable these APIs even without the latest VSCode engine.
 * This approach allows us to leverage advanced features when available while ensuring broad compatibility.
 */
declare module 'vscode' {
  // https://github.com/microsoft/vscode/blob/f0417069c62e20f3667506f4b7e53ca0004b4e3e/src/vscode-dts/vscode.d.ts#L7442
  interface Terminal {
    // @ts-expect-error
    shellIntegration?: {
      cwd?: vscode.Uri;
      executeCommand?: (command: string) => {
        read: () => AsyncIterable<string>;
      };
    };
  }
  // https://github.com/microsoft/vscode/blob/f0417069c62e20f3667506f4b7e53ca0004b4e3e/src/vscode-dts/vscode.d.ts#L10794
  interface Window {
    onDidStartTerminalShellExecution?: (
      listener: (e: any) => any,
      thisArgs?: any,
      disposables?: vscode.Disposable[],
    ) => vscode.Disposable;
  }
}

export class TerminalManager {
  private terminalIds: Set<number> = new Set();
  private processes: Map<number, TerminalProcess> = new Map();
  private disposables: vscode.Disposable[] = [];

  constructor() {
    let disposable: vscode.Disposable | undefined;
    try {
      disposable = (
        vscode.window as vscode.Window
      ).onDidStartTerminalShellExecution?.(async (e) => {
        // Creating a read stream here results in a more consistent output. This is most obvious when running the `date` command.
        e?.execution?.read();
      });
    } catch (error) {
      console.error('Error setting up onDidEndTerminalShellExecution', error);
    }
    if (disposable) {
      this.disposables.push(disposable);
    }
  }

  /**
   * Run a command in a terminal.
   * @param terminalInfo The terminal to run the command in
   * @param command The command to run
   * @returns A promise that resolves when the command is completed
   */
  public runCommand(
    terminalInfo: TerminalInfo,
    command: string,
  ): TerminalProcessResultPromise {
    terminalInfo.busy = true;
    terminalInfo.lastCommand = command;
    const process = new TerminalProcess();
    this.processes.set(terminalInfo.id, process);

    process.once('completed', () => {
      terminalInfo.busy = false;
    });

    // if shell integration is not available, remove terminal so it does not get reused as it may be running a long-running process
    process.once('no_shell_integration', () => {
      console.log(
        `no_shell_integration received for terminal ${terminalInfo.id}`,
      );
      // Remove the terminal so we can't reuse it (in case it's running a long-running process)
      TerminalRegistry.removeTerminal(terminalInfo.id);
      this.terminalIds.delete(terminalInfo.id);
      this.processes.delete(terminalInfo.id);
    });

    const promise = new Promise<void>((resolve, reject) => {
      process.once('continue', () => {
        resolve();
      });
      process.once('error', (error) => {
        console.error(`Error in terminal ${terminalInfo.id}:`, error);
        reject(error);
      });
    });

    // if shell integration is already active, run the command immediately
    if (terminalInfo.terminal.shellIntegration) {
      process.waitForShellIntegration = false;
      void process.run(terminalInfo.terminal, command);
    } else {
      // docs recommend waiting 3s for shell integration to activate
      pWaitFor(() => terminalInfo.terminal.shellIntegration !== undefined, {
        timeout: 4000,
      }).finally(() => {
        const existingProcess = this.processes.get(terminalInfo.id);
        if (existingProcess && existingProcess.waitForShellIntegration) {
          existingProcess.waitForShellIntegration = false;
          void existingProcess.run(terminalInfo.terminal, command);
        }
      });
    }

    return mergePromise(process, promise);
  }

  /**
   * Get or create a terminal for a given cwd.
   * @param cwd The current working directory
   * @returns The terminal info
   */
  public async getOrCreateTerminal(cwd: string): Promise<TerminalInfo> {
    // Find available terminal from our pool first (created for this task)
    const allTerminals = TerminalRegistry.getAllTerminals();
    const availableTerminal = allTerminals.find((t) => {
      if (t.busy) {
        return false;
      }
      const terminalCwd = t.terminal.shellIntegration?.cwd;
      if (!terminalCwd) {
        return false;
      }
      return arePathsEqual(vscode.Uri.file(cwd).fsPath, terminalCwd.fsPath);
    });
    if (availableTerminal) {
      this.terminalIds.add(availableTerminal.id);
      return availableTerminal;
    }

    const newTerminalInfo = TerminalRegistry.createTerminal(cwd);
    this.terminalIds.add(newTerminalInfo.id);
    return newTerminalInfo;
  }

  /**
   * Get terminals by busy status.
   * @param busy Whether the terminal is busy
   * @returns An array of terminal IDs and their last command
   */
  public getTerminals(busy: boolean): { id: number; lastCommand: string }[] {
    return Array.from(this.terminalIds)
      .map((id) => TerminalRegistry.getTerminal(id))
      .filter((t): t is TerminalInfo => t !== undefined && t.busy === busy)
      .map((t) => ({ id: t.id, lastCommand: t.lastCommand }));
  }

  /**
   * Get the unretrieved output for a terminal.
   * @param terminalId The terminal ID
   * @returns The unretrieved output
   */
  public getUnretrievedOutput(terminalId: number): string {
    if (!this.terminalIds.has(terminalId)) {
      return '';
    }
    const process = this.processes.get(terminalId);
    return process ? process.getUnretrievedOutput() : '';
  }

  /**
   * Check if a terminal is busy.
   * @param terminalId The terminal ID
   * @returns Whether the terminal is busy
   */
  public isProcessHot(terminalId: number): boolean {
    const process = this.processes.get(terminalId);
    return process ? process.isHot : false;
  }

  /**
   * Dispose all terminals and processes.
   */
  public disposeAll() {
    this.terminalIds.clear();
    this.processes.clear();
    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables = [];
  }
}
