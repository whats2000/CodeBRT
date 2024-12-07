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

  // A flag to see the end of file style as the LLM tends to not include the last newline
  const endOfFileStyle = existingContent.endsWith('\n') ? '\n' : '';

  // Save version before writing
  await vscode.commands.executeCommand('code-brt.saveFileVersion', filePath);

  let completeContent = content;

  // If the content is partial code, fuse it with the existing content
  if (isCodePartial) {
    updateStatus?.('[processing] Inserting code snippet to file...');
    const result = await partialCodeFuser.fusePartialCode({
      originalCode: existingContent,
      partialCode: content,
      relativeFilePath: filePath,
    });

    if (result) {
      // Clear the ```fileExtension and ``` from the code block
      completeContent = result.replace(/^```.*\n/, '').replace(/```$/, '');
    } else {
      vscode.window.showErrorMessage(
        'The code fuser failed to fuse the partial code. Please manually check the file.',
      );
    }
  }

  // If the original content is EOF with a newline, add a newline to the end of the content if it doesn't have one
  if (existingContent.endsWith('\n') && !completeContent.endsWith('\n')) {
    completeContent += '\n';
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
