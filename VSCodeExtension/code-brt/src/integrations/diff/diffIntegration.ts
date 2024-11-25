import * as path from 'path';
import * as fs from 'fs';

import * as vscode from 'vscode';

import type { FileVersion } from './types';

export class DiffIntegration {
  private readonly contentProvider: vscode.TextDocumentContentProvider;
  private readonly historiesFolderPath: string;
  private readonly historyIndexFilePath: string;
  private readonly MAX_VERSIONS_PER_FILE: number = 1;
  private activeFilePath: string | undefined;
  private fileHistory: Map<string, FileVersion[]> = new Map();

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

  private createContentProvider(): vscode.TextDocumentContentProvider {
    return {
      provideTextDocumentContent(uri: vscode.Uri): string {
        return uri.query || '';
      },
    };
  }

  private loadHistoryIndex(): void {
    try {
      if (fs.existsSync(this.historyIndexFilePath)) {
        const indexContent = fs.readFileSync(this.historyIndexFilePath, 'utf8');
        const parsedIndex = JSON.parse(indexContent);

        // Rebuild fileHistory from parsed index
        for (const [filePath, versions] of Object.entries(parsedIndex)) {
          this.fileHistory.set(filePath, versions as FileVersion[]);
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

  private cleanupOldVersions(filePath: string): void {
    const versions = this.fileHistory.get(filePath) || [];

    // If versions exceed max, remove oldest
    if (versions.length > this.MAX_VERSIONS_PER_FILE) {
      // Sort by timestamp (oldest first)
      const sortedVersions = [...versions].sort(
        (a, b) => a.timestamp - b.timestamp,
      );

      // Remove excess oldest versions
      const versionsToRemove = sortedVersions.slice(
        0,
        versions.length - this.MAX_VERSIONS_PER_FILE,
      );

      // Remove files from filesystem
      versionsToRemove.forEach((version) => {
        try {
          if (fs.existsSync(version.path)) {
            fs.unlinkSync(version.path);
          }
        } catch (error) {
          console.error(`Failed to remove old version: ${version.path}`, error);
        }
      });

      // Update file history
      this.fileHistory.set(
        filePath,
        versions.filter((v) => !versionsToRemove.includes(v)),
      );
    }
  }

  /**
   * Save a version of the file to history
   * @param filePath Path of the file to save
   */
  public saveFileVersion(filePath: string): void {
    try {
      // Check if the file exists
      let fileContent = '';
      if (fs.existsSync(filePath)) {
        // If file exists, read its content
        fileContent = fs.readFileSync(filePath, 'utf8');
      } else {
        // For newly created files with no content, use empty string
        fileContent = '';
      }

      // Get or create history for this file
      const fileVersions = this.fileHistory.get(filePath) || [];
      const newVersionNumber = fileVersions.length + 1;

      // Generate a unique filename for this version
      const timestamp = Date.now();
      const tempFileName = `${path.basename(filePath)}_v${newVersionNumber}_${timestamp}`;
      const tempFilePath = path.join(this.historiesFolderPath, tempFileName);

      // Write file content to history
      fs.writeFileSync(tempFilePath, fileContent);

      // Store version information
      const newVersion: FileVersion = {
        version: newVersionNumber,
        path: tempFilePath,
        timestamp,
      };
      fileVersions.push(newVersion);
      this.fileHistory.set(filePath, fileVersions);

      // Cleanup old versions if needed
      this.cleanupOldVersions(filePath);

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
   * @param versionIndex Optional index of a version to revert to (defaults to most recent)
   * @param dropVersion Whether to drop the reverted version from history
   */
  public async revertFileVersion(
    filePath: string,
    versionIndex?: number,
    dropVersion: boolean = false,
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

      // Write version content back to an original file
      fs.writeFileSync(filePath, versionContent);

      // If requested, remove the reverted version
      if (dropVersion) {
        fs.unlinkSync(versionToRevert.path);
        this.fileHistory.set(
          filePath,
          fileVersions.filter((v) => v !== versionToRevert),
        );
      }

      // Reload document in VSCode
      const document = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to revert file version: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Show a diff view between two versions of a file
   * @param filePath Path of the file to diff
   * @param originalContent Original content to compare
   * @param newContent New content to compare
   */
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
