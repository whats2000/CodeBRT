import vscode from 'vscode';

import { ToolServicesApi } from './types';
import { FileOperationsProvider } from '../../utils';

export const searchFilesTool: ToolServicesApi['searchFiles'] = async ({
  relativePath,
  regex,
  filePattern,
  updateStatus,
}) => {
  const currentWorkspacePath =
    vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  if (!currentWorkspacePath) {
    return {
      status: 'error',
      result: 'No workspace folder found, tell user to open a workspace.',
    };
  }

  updateStatus?.('[processing] Searching for files...');

  const result = await FileOperationsProvider.searchFiles(
    {
      relativePath,
      regex,
      filePattern,
    },
    currentWorkspacePath,
  );

  updateStatus?.('');

  if (result.status === 'error') {
    return {
      status: 'error',
      result: result.message ?? 'An error occurred while searching for files.',
    };
  }

  return {
    status: 'success',
    result:
      `The following files were found, ` +
      `please continue the task with the found files: \n${result.results?.join('\n')}`,
  };
};
