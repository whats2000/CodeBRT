import vscode from 'vscode';

import { ToolServicesApi } from './types';
import { FileOperationsProvider } from '../../utils';

export const searchFilesTool: ToolServicesApi['searchFiles'] = async ({
  relativePath,
  regex,
  filePattern,
  updateStatus,
}) => {
  const workspaceFolders = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolders) {
    updateStatus?.('[error] No workspace folders found.');
    return {
      status: 'error',
      result: 'No workspace folders found. Tell the user to open a workspace.',
    };
  }

  updateStatus?.('[processing] Searching for files...');

  const currentWorkspacePath = workspaceFolders.uri.fsPath;

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

  if (result.results?.length === 0) {
    return {
      status: 'success',
      result: `No files found in directory: "${relativePath}".`,
    };
  }

  return {
    status: 'success',
    result:
      `The following files were found, ` +
      `please continue the task with the found files: \n${result.results?.join('\n')}`,
  };
};
