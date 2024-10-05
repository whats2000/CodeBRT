import * as vscode from 'vscode';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    // Create a status bar item on the right side (priority 1000 ensures it appears to the right)
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      1000,
    );
    this.statusBarItem.text = 'CodeBRT';
    this.statusBarItem.tooltip =
      'Click to open CodeBRT chat view for configuration';
    this.statusBarItem.command = 'code-brt.openMainView';
    this.statusBarItem.show();
  }

  /**
   * Show processing status when LLM is performing a task.
   */
  public showProcessing() {
    this.statusBarItem.text = '$(sync~spin) Processing...';
    this.statusBarItem.show();
  }

  /**
   * Show idle status when the LLM task is completed or idle.
   */
  public showIdle() {
    this.statusBarItem.text = '$(check) CodeBRT';
    this.statusBarItem.show();
  }

  /**
   * Dispose the status bar item.
   */
  public dispose() {
    this.statusBarItem.dispose();
  }
}
