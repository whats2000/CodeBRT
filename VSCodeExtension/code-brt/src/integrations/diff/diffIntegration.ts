import { DiffControllerOptions, DiffResult } from './types';
import vscode from 'vscode';

export class DiffIntegration {
  private options: DiffControllerOptions;

  constructor(options: DiffControllerOptions = {}) {
    this.options = {
      tempDiffPath:
        vscode.workspace.getConfiguration().get('extensionName.tempDiffPath') ||
        '/tmp/vscode-diff',
      autoCleanup: true,
      ...options,
    };
  }

  /**
   * Compute differences between two text contents
   * @param originalContent Original text content
   * @param modifiedContent Modified text content
   * @returns Detailed diff result
   */
  computeDiff(originalContent: string, modifiedContent: string): DiffResult {
    const originalLines = originalContent.split('\n');
    const modifiedLines = modifiedContent.split('\n');

    let added: number;
    let removed = 0;
    let modified = 0;

    // Simple diff algorithm
    originalLines.forEach((line, index) => {
      if (index >= modifiedLines.length) {
        removed++;
      } else if (line !== modifiedLines[index]) {
        modified++;
      }
    });

    added = Math.max(0, modifiedLines.length - originalLines.length);

    return {
      hasDifferences: added > 0 || removed > 0 || modified > 0,
      diffDetails: {
        added,
        removed,
        modified,
      },
    };
  }

  /**
   * Open a diff view in VSCode
   * @param originalUri URI of the original file
   * @param modifiedUri URI of the modified file
   * @param title Optional title for the diff view
   */
  openDiffView(
    originalUri: vscode.Uri,
    modifiedUri: vscode.Uri,
    title: string = 'File Difference',
  ): void {
    void vscode.commands.executeCommand(
      'vscode.diff',
      originalUri,
      modifiedUri,
      title,
    );
  }

  /**
   * Create a temporary file with content
   * @param content Content to write
   * @returns URI of the created temporary file
   */
  createTempFile(content: string): vscode.Uri {
    const tempFile = vscode.Uri.file(
      `${this.options.tempDiffPath}/temp_diff_${Date.now()}.txt`,
    );

    const writeEdit = new vscode.WorkspaceEdit();
    writeEdit.createFile(tempFile, { overwrite: true });
    writeEdit.insert(tempFile, new vscode.Position(0, 0), content);

    void vscode.workspace.applyEdit(writeEdit);

    if (this.options.autoCleanup) {
      // Schedule temp file deletion
      setTimeout(
        () => {
          void vscode.workspace.fs.delete(tempFile);
        },
        5 * 60 * 1000,
      ); // 5 minutes
    }

    return tempFile;
  }
}
