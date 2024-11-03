import vscode from 'vscode';

import fs from 'node:fs/promises';
import path from 'node:path';
import type { ViewKey } from '../../views';

export const getWebviewUri = async (
  ctx: vscode.ExtensionContext,
  connectedViews: Partial<Record<ViewKey, vscode.WebviewView>>,
  absolutePath: string,
): Promise<string> => {
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
};
