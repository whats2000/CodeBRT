import path from 'path';
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
      result: 'No workspace folders found. Please open a workspace to proceed.',
    };
  }

  updateStatus?.('[processing] Searching for files...');

  const currentWorkspacePath = workspaceFolders.uri.fsPath;
  const dirPath = path.resolve(currentWorkspacePath, relativePath);

  // Call the search function
  const result = await FileOperationsProvider.searchFiles(
    dirPath,
    currentWorkspacePath,
    regex,
    filePattern,
  );

  updateStatus?.('');

  if (result.status === 'error') {
    return {
      status: 'error',
      result: result.message ?? 'An error occurred while searching for files.',
    };
  }

  if (!result.results || result.results.length === 0) {
    return {
      status: 'success',
      result: `No files found matching the criteria in directory: "${relativePath}".`,
    };
  }

  // Format the results to match the specified output style
  const formattedResults = result.results.map((res) => {
    const fileInfo = `${res.file}\n│----\n`;
    const matchLine = `│${res.match.trimEnd()}`;
    const beforeContext = res.beforeContext
      .map((line) => `│${line.trimEnd()}`)
      .join('\n');
    const afterContext = res.afterContext
      .map((line) => `│${line.trimEnd()}`)
      .join('\n');

    return (
      `${fileInfo}` +
      (beforeContext ? `${beforeContext}\n` : '') +
      `${matchLine}\n` +
      (afterContext ? `${afterContext}\n` : '') +
      `│----`
    );
  });

  return {
    status: 'success',
    result:
      `Search completed. The following files contain matches for your query:\n\n` +
      `${formattedResults.join('\n\n')}`,
  };
};
