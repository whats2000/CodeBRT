import path from 'node:path';
import fs from 'node:fs/promises';

import vscode from 'vscode';

import { filePathExists } from './utils';

export const uploadFile = async (
  ctx: vscode.ExtensionContext,
  base64Data: string,
  originalName: string,
): Promise<string> => {
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
  let fileName = originalName;
  let extension = path.extname(fileName);

  // Ensure extension matches the MIME type
  if (!extension) {
    extension = `.${mimeType.split('/')[1]}`;
    fileName += extension;
  }

  let fullPath = path.join(mediaDir, fileName);
  let counter = 1;

  // Check if a file with the same name already exists
  while (await filePathExists(fullPath)) {
    fileName = `${path.basename(originalName, extension)}(${counter})${extension}`;
    fullPath = path.join(mediaDir, fileName);
    counter++;
  }

  try {
    await fs.writeFile(fullPath, buffer);
  } catch (error) {
    throw new Error('Failed to write file: ' + error);
  }

  return fullPath;
};
