import type { ToolServicesApi } from './types';
import { FileOperationsProvider } from '../../utils';
import vscode from 'vscode';
import path from 'path';

export const readFileTool: ToolServicesApi['readFile'] = async ({
  relativeFilePath,
  updateStatus,
}) => {
  const workspaceFolders = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolders) {
    return {
      status: 'error',
      result: 'No workspace folders found. Tell the user to open a workspace.',
    };
  }

  updateStatus?.('[processing] Reading file...');

  const filePath = path.resolve(workspaceFolders.uri.fsPath, relativeFilePath);

  const result = await FileOperationsProvider.readFile(filePath);

  updateStatus?.('');

  if (result.status === 'error') {
    return { status: 'error', result: result.message };
  }

  return {
    status: 'success',
    result:
      `File content from "${relativeFilePath}" are show below, ` +
      `please check it out and continue with the next step:\n\n${result.message}`,
  };
};
