import fs from 'node:fs/promises';
import vscode from 'vscode';

export const deleteFile = async (absolutePath: string) => {
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to delete file: ${error}`);
  }
};
