/**
 * This file contains code modify from repository cline, from the clinebot, which is licensed under
 * the Apache License, Version 2.0. You can obtain a copy of the Apache License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * The related file is located at:
 * https://github.com/cline/cline/blob/main/src/integrations/terminal/TerminalRegistry.ts
 */
import * as vscode from 'vscode';

export interface TerminalInfo {
  terminal: vscode.Terminal;
  busy: boolean;
  lastCommand: string;
  id: number;
}

/**
 * Although vscode.window.terminals provides a list of all open terminals,
 * there's no way to know whether they're busy or not
 * (exitStatus does not provide useful information for most commands).
 * To prevent creating too many terminals,
 * we need to keep track of terminals through the life of the extension,
 * as well as session-specific terminals for the life of a task (to get the latest unretrieved output).
 *
 * Since we have promises keeping track of terminal processes,
 * we get the added benefit of keep track of busy terminals even after a task is closed.
 */
export class TerminalRegistry {
  private static terminals: TerminalInfo[] = [];
  private static nextTerminalId = 1;

  /**
   * Check if terminal is closed
   * The exit status of the terminal will be undefined while the terminal is active.
   * (This value is set when onDidCloseTerminal is fired.)
   * @param terminal Terminal to check
   */
  private static isTerminalClosed(terminal: vscode.Terminal): boolean {
    return terminal.exitStatus !== undefined;
  }

  /**
   * Create a new terminal
   * @param cwd Working directory for the terminal
   * @returns TerminalInfo
   */
  public static createTerminal(
    cwd?: string | vscode.Uri | undefined,
  ): TerminalInfo {
    const terminal = vscode.window.createTerminal({
      cwd,
      name: 'CodeBRT',
      iconPath: new vscode.ThemeIcon('rocket'),
    });
    const newInfo: TerminalInfo = {
      terminal,
      busy: false,
      lastCommand: '',
      id: this.nextTerminalId++,
    };
    this.terminals.push(newInfo);
    return newInfo;
  }

  /**
   * Get terminal by id
   * @param id Terminal id
   * @returns TerminalInfo or undefined if terminal is closed
   */
  public static getTerminal(id: number): TerminalInfo | undefined {
    const terminalInfo = this.terminals.find((t) => t.id === id);
    if (terminalInfo && this.isTerminalClosed(terminalInfo.terminal)) {
      this.removeTerminal(id);
      return undefined;
    }
    return terminalInfo;
  }

  /**
   * Update terminal info
   * @param id Terminal id
   * @param updates Partial updates to terminal info
   */
  public static updateTerminal(id: number, updates: Partial<TerminalInfo>) {
    const terminal = this.getTerminal(id);
    if (terminal) {
      Object.assign(terminal, updates);
    }
  }

  /**
   * Remove terminal from registry
   * @param id Terminal id
   */
  public static removeTerminal(id: number) {
    this.terminals = this.terminals.filter((t) => t.id !== id);
  }

  /**
   * Get all terminals
   * @returns Array of terminal info
   */
  public static getAllTerminals(): TerminalInfo[] {
    this.terminals = this.terminals.filter(
      (t) => !this.isTerminalClosed(t.terminal),
    );
    return this.terminals;
  }
}
