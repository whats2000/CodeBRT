import path from 'path';

import vscode from 'vscode';

import type { ToolServicesApi } from './types';
import { FileOperationsProvider } from '../../utils';
import { DiffViewProvider } from '../diff/diffViewProvider';

export const writeToFileTool: ToolServicesApi['writeToFile'] = async ({
  relativePath,
  content,
  updateStatus,
}) => {
  const workspaceFolders = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolders) {
    return {
      status: 'error',
      result: 'No workspace folders found. Tell the user to open a workspace.',
    };
  }

  updateStatus?.('[processing] Writing to file...');

  const filePath = path.resolve(workspaceFolders.uri.fsPath, relativePath);

  let existingContent = '';
  try {
    const document = await vscode.workspace.openTextDocument(filePath);
    existingContent = document.getText();
  } catch (error) {
    existingContent = '';
  }

  const { status, message } = await FileOperationsProvider.writeToFile(
    filePath,
    content,
    true,
  );

  updateStatus?.('');

  if (status === 'error') {
    return { status: 'error', result: message };
  }

  await DiffViewProvider.showDiff(filePath, existingContent, content);

  return { status: 'success', result: message };
};