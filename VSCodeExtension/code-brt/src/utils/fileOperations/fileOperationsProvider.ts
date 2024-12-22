import vscode from 'vscode';

import { ViewKey } from '../../views';
import { deleteFile } from './deleteFile';
import { getWebviewUri } from './getWebviewUri';
import { listFiles } from './listFiles';
import { uploadFile } from './uploadFile';
import { writeToFile } from './writeToFIle';
import { readFile } from './readFile';
import { searchFiles } from './searchFiles';
import type { SearchResult } from './types/SearchContext';

export abstract class FileOperationsProvider {
  /**
   * Upload a file.
   * @param ctx - The extension context.
   * @param base64Data - Data URL format string.
   * @param originalName - The original name of the file being uploaded.
   */
  static async uploadFile(
    ctx: vscode.ExtensionContext,
    base64Data: string,
    originalName: string,
  ): Promise<string> {
    return uploadFile(ctx, base64Data, originalName);
  }

  /**
   * Delete a file.
   * @param absolutePath - The absolute path of the file to delete.
   */
  static async deleteFile(absolutePath: string): Promise<void> {
    return deleteFile(absolutePath);
  }

  /**
   * Get the webview URI for a path.
   * @param ctx - The extension context.
   * @param connectedViews - The connected views.
   * @param absolutePath - The absolute path to get the URI for.
   */
  static async getWebviewUri(
    ctx: vscode.ExtensionContext,
    connectedViews: Partial<Record<ViewKey, vscode.WebviewView>>,
    absolutePath: string,
  ): Promise<string> {
    return getWebviewUri(ctx, connectedViews, absolutePath);
  }

  /**
   * List files in a directory with blacklist filtering, recursion, and file limit.
   * @param dirPath - The directory path to list files from.
   * @param recursive - Whether to list files recursively.
   * @param limit - The maximum number of files to return.
   */
  static async listFiles(
    dirPath: string,
    recursive: boolean,
    limit: number,
  ): Promise<{
    limitReached: boolean;
    filesList: string[];
    absoluteFilesList: string[];
  }> {
    return listFiles(dirPath, recursive, limit);
  }

  /**
   * Write content to a file.
   * @param filePath - The path to the file.
   * @param content - The content to write to the file.
   * @param overwrite - Whether to overwrite the file if it already exists.
   * @param updateStatus - Optional function to update the status message.
   */
  static async writeToFile(
    filePath: string,
    content: string,
    overwrite = false,
    updateStatus?: (status: string) => void,
  ): Promise<{ status: 'success' | 'error'; message: string }> {
    return writeToFile(filePath, content, overwrite, updateStatus);
  }

  /**
   * Read content from a file.
   * @param filePath - The path to the file.
   */
  static async readFile(
    filePath: string,
  ): Promise<{ status: 'success' | 'error'; message: string }> {
    return readFile(filePath);
  }

  /**
   * Searches for files in a specified directory with options for filtering by regular expression filename patterns.
   * @param dirPath - The directory path to search in.
   * @param currentWorkspacePath - The path to the current workspace.
   * @param regex - The regular expression to match file content.
   * @param filePattern - The glob pattern which the file content should match.
   * @returns The status and list of matched file paths or an error message.
   */
  static async searchFiles(
    dirPath: string,
    currentWorkspacePath: string,
    regex: string,
    filePattern?: string,
  ): Promise<{
    status: 'success' | 'error';
    results?: SearchResult[];
    message?: string;
  }> {
    return searchFiles(dirPath, currentWorkspacePath, regex, filePattern);
  }
}
