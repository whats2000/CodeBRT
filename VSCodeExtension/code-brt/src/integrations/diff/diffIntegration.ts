import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class DiffIntegration {
  private readonly contentProvider: vscode.TextDocumentContentProvider;
  private readonly historiesFolderPath: string;
  private readonly historyIndexFilePath: string;
  private activeFilePath: string | undefined;
  private fileHistory: Map<string, { version: number; path: string }[]> =
    new Map();

  constructor(
    context: vscode.ExtensionContext,
    indexFileName: string = 'fileHistoryIndex.json',
  ) {
    this.contentProvider = this.createContentProvider();
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (workspaceFolders) {
      // Prefer .vscode folder in the first workspace folder
      const vscodePath = path.join(workspaceFolders[0].uri.fsPath, '.vscode');
      if (!fs.existsSync(vscodePath)) {
        fs.mkdirSync(vscodePath);
      }

      this.historiesFolderPath = path.join(vscodePath, 'fileHistories');
      this.historyIndexFilePath = path.join(vscodePath, indexFileName);
    } else {
      // Fallback to extension context storage
      this.historiesFolderPath = path.join(
        context.extensionPath,
        'fileHistories',
      );
      this.historyIndexFilePath = path.join(
        context.extensionPath,
        indexFileName,
      );
    }

    // Ensure histories folder exists
    if (!fs.existsSync(this.historiesFolderPath)) {
      fs.mkdirSync(this.historiesFolderPath, { recursive: true });
    }

    // Load existing history index
    this.loadHistoryIndex();
  }

  private loadHistoryIndex(): void {
    try {
      if (fs.existsSync(this.historyIndexFilePath)) {
        const indexContent = fs.readFileSync(this.historyIndexFilePath, 'utf8');
        const parsedIndex = JSON.parse(indexContent);

        // Rebuild fileHistory from parsed index
        for (const [filePath, versions] of Object.entries(parsedIndex)) {
          this.fileHistory.set(
            filePath,
            versions as { version: number; path: string }[],
          );
        }
      }
    } catch (error) {
      void vscode.window.showWarningMessage(
        `Failed to load file history index: ${error}`,
      );
    }
  }

  private saveHistoryIndex(): void {
    try {
      const indexData = Object.fromEntries(this.fileHistory.entries());
      fs.writeFileSync(
        this.historyIndexFilePath,
        JSON.stringify(indexData, null, 2),
      );
    } catch (error) {
      void vscode.window.showErrorMessage(
        `Failed to save file history index: ${error}`,
      );
    }
  }

  // Rest of the existing methods (showDiff, closeDiffAndFocusModified, createContentProvider) remain the same
  private createContentProvider(): vscode.TextDocumentContentProvider {
    return {
      provideTextDocumentContent(uri: vscode.Uri): string {
        return uri.query || '';
      },
    };
  }

  /**
   * Save a version of the file to file history
   * @param filePath Path of the file to save
   */
  public saveFileVersion(filePath: string): void {
    try {
      // Read current file content
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Get or create history for this file
      const fileVersions = this.fileHistory.get(filePath) || [];
      const newVersionNumber = fileVersions.length + 1;

      // Generate a unique filename for this version
      const tempFileName = `${path.basename(filePath)}_v${newVersionNumber}`;
      const tempFilePath = path.join(this.historiesFolderPath, tempFileName);

      // Write file content to history
      fs.writeFileSync(tempFilePath, fileContent);

      // Store version information
      fileVersions.push({ version: newVersionNumber, path: tempFilePath });
      this.fileHistory.set(filePath, fileVersions);

      // Save updated index
      this.saveHistoryIndex();
    } catch (error) {
      void vscode.window.showErrorMessage(
        `Failed to save file version: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Revert file to a previous version
   * @param filePath Path of the file to revert
   * @param versionIndex Optional index of version to revert to (defaults to most recent)
   */
  public async revertFileVersion(
    filePath: string,
    versionIndex?: number,
  ): Promise<void> {
    try {
      const fileVersions = this.fileHistory.get(filePath);

      if (!fileVersions || fileVersions.length === 0) {
        vscode.window.showWarningMessage(
          'No previous versions found for this file',
        );
        return;
      }

      // Use specified index or last version
      const targetIndex =
        versionIndex !== undefined ? versionIndex : fileVersions.length - 1;

      if (targetIndex < 0 || targetIndex >= fileVersions.length) {
        vscode.window.showWarningMessage('Invalid version index');
        return;
      }

      const versionToRevert = fileVersions[targetIndex];

      // Read version content
      const versionContent = fs.readFileSync(versionToRevert.path, 'utf8');

      // Write version content back to original file
      fs.writeFileSync(filePath, versionContent);

      // Reload document in VSCode
      const document = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(document);

      vscode.window.showInformationMessage(
        `Reverted ${path.basename(filePath)} to version ${versionToRevert.version}`,
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to revert file version: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  public async showDiff(
    filePath: string,
    originalContent: string,
    newContent: string,
  ): Promise<void> {
    // Implementation remains the same as in previous version
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

    // Reset the active path
    this.activeFilePath = undefined;
  }
}
