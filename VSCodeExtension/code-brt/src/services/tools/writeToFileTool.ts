import path from 'path';

import vscode from 'vscode';

import type { ToolServicesApi } from './types';
import { FileOperationsProvider } from '../../utils';

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

  await showDiffInEditor(filePath, existingContent, content);

  return { status: 'success', result: message };
};

const showDiffInEditor = async (
  filePath: string,
  originalContent: string,
  newContent: string
) => {
  const originalUri = vscode.Uri.parse(`diff:Original/${path.basename(filePath)}`);
  const modifiedUri = vscode.Uri.parse(`diff:Modified/${path.basename(filePath)}`);

  const contentProvider = new (class implements vscode.TextDocumentContentProvider {
    provideTextDocumentContent(uri: vscode.Uri): string {
      if (uri.toString() === originalUri.toString()) {
        return originalContent;
      }
      if (uri.toString() === modifiedUri.toString()) {
        return newContent;
      }
      return '';
    }
  })();

  const scheme = 'diff';
  vscode.workspace.registerTextDocumentContentProvider(scheme, contentProvider);

  await vscode.commands.executeCommand(
    'vscode.diff',
    originalUri,
    modifiedUri,
    `Diff: ${path.basename(filePath)}`
  );
};