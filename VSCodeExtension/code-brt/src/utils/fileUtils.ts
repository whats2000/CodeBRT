import fs from 'node:fs/promises';
import vscode from 'vscode';
import path from 'node:path';
import { ViewKey } from '../views';

export abstract class FileUtils {
  /**
   * Upload a file.
   * @param ctx - The extension context.
   * @param base64Data - Data Url format string.
   */
  static async uploadFile(
    ctx: vscode.ExtensionContext,
    base64Data: string,
  ): Promise<string> {
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 data');
    }

    const [, mimeType, data] = matches;
    const mediaDir = path.join(ctx.extensionPath, 'media');

    try {
      await fs.mkdir(mediaDir, { recursive: true });
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to create media directory: ${error}`,
      );
    }

    const buffer = Buffer.from(data, 'base64');
    const fileName = path.join(
      mediaDir,
      `${Date.now()}.${mimeType.split('/')[1]}`,
    );

    try {
      await fs.writeFile(fileName, buffer);
    } catch (error) {
      throw new Error('Failed to write image file: ' + error);
    }

    return fileName;
  }

  /**
   * Delete a file.
   * @param absolutePath - The absolute path of the file to delete.
   */
  static async deleteFile(absolutePath: string) {
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to delete file: ${error}`);
    }
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
  ) {
    try {
      await fs.access(absolutePath);

      const extensionPath = ctx.extensionPath.endsWith(path.sep)
        ? ctx.extensionPath
        : ctx.extensionPath + path.sep;

      const relativePath = path.relative(extensionPath, absolutePath);

      const panel = connectedViews?.chatActivityBar;

      if (!panel) return '';

      const imagePath = path.join(ctx.extensionPath, relativePath);

      const imageUri = panel.webview.asWebviewUri(vscode.Uri.file(imagePath));

      return imageUri.toString();
    } catch (error) {
      console.error('Failed to get webview URI:', error);
      return '';
    }
  }
}
