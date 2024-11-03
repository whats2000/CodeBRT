import vscode from 'vscode';

import { ViewKey } from '../../../views';
import { uploadFile } from '../uploadFile';
import { getWebviewUri } from '../getWebviewUri';
import { deleteFile } from '../deleteFile';
import { listFiles } from '../listFiles';

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
  ): Promise<{ limitReached: boolean; filesList: string[] }> {
    return listFiles(dirPath, recursive, limit);
  }
}
