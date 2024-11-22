import * as vscode from 'vscode';
import * as path from 'path';

export class DiffIntegration {
  private activeFilePath: string | undefined;
  private readonly contentProvider: vscode.TextDocumentContentProvider;

  constructor() {
    this.contentProvider = this.createContentProvider();
  }

  private createContentProvider(): vscode.TextDocumentContentProvider {
    return {
      provideTextDocumentContent(uri: vscode.Uri): string {
        // Custom logic can be added here if needed
        return uri.query || '';
      },
    };
  }

  /**
   * Show diff view for two pieces of content
   * @param filePath Original file path
   * @param originalContent Original content
   * @param newContent New content
   */
  public async showDiff(
    filePath: string,
    originalContent: string,
    newContent: string,
  ): Promise<void> {
    // Create unique URIs using the custom 'diff:' scheme
    const originalUri = vscode.Uri.parse(
      `diff:Original/${path.basename(filePath)}?${encodeURIComponent(originalContent)}`,
    );
    const modifiedUri = vscode.Uri.parse(
      `diff:Modified/${path.basename(filePath)}?${encodeURIComponent(newContent)}`,
    );

    // Register the content provider (if not already registered)
    vscode.workspace.registerTextDocumentContentProvider(
      'diff',
      this.contentProvider,
    );

    // Open diff view
    await vscode.commands.executeCommand(
      'vscode.diff',
      originalUri,
      modifiedUri,
      `Diff: ${path.basename(filePath)}`,
    );

    // Save the active file path
    this.activeFilePath = filePath;
  }

  /**
   * Close the active diff editor
   * Method 2: Focus on the modified file
   */
  public async closeDiffAndFocusModified(): Promise<void> {
    // First, try to select the modified (right-side) editor
    await vscode.commands.executeCommand('workbench.action.focusRightGroup');

    // Then close the diff view
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

    // Open the modified file
    if (this.activeFilePath) {
      await vscode.commands.executeCommand(
        'vscode.open',
        vscode.Uri.file(this.activeFilePath),
      );
    }

    // Reset the active file path
    this.activeFilePath = undefined;
  }
}
