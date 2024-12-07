import path from 'path';

import vscode from 'vscode';

import type { ToolServicesApi } from './types';
import { FileOperationsProvider } from '../../utils';

export const writeToFileTool: ToolServicesApi['writeToFile'] = async ({
  relativePath,
  content,
  isCodePartial,
  partialCodeFuser,
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

  let existingContent: string;
  try {
    const document = await vscode.workspace.openTextDocument(filePath);
    existingContent = document.getText();
  } catch (error) {
    existingContent = '';
  }

  // Save version before writing
  await vscode.commands.executeCommand('code-brt.saveFileVersion', filePath);

  let completeContent = content;

  // If the content is partial code, fuse it with the existing content
  if (isCodePartial) {
    const result = await partialCodeFuser.fusePartialCode({
      originalCode: existingContent,
      partialCode: content,
      relativeFilePath: filePath,
    });

    if (result) {
      completeContent = result;
    } else {
      vscode.window.showErrorMessage(
        'The code fuser failed to fuse the partial code. Please manually check the file.',
      );
    }
  }

  const { status, message } = await FileOperationsProvider.writeToFile(
    filePath,
    completeContent,
    true,
  );

  updateStatus?.('');

  if (status === 'error') {
    return { status: 'error', result: message };
  }

  // Show a diff
  await vscode.commands.executeCommand(
    'code-brt.showDiff',
    filePath,
    existingContent,
    completeContent,
  );

  return { status: 'success', result: message };
};
