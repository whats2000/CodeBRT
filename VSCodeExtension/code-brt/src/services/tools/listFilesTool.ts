import { ToolServicesApi } from './types';
import { FileOperationsProvider } from '../../utils';
import path from 'path';
import vscode from 'vscode';

export const listFilesTool: ToolServicesApi['listFiles'] = async ({
  relativePath,
  recursive = false,
  limit = 200,
  updateStatus,
}) => {
  // Start by updating the status to indicate the file listing has begun.
  updateStatus?.('[processing] Listing files...');

  const workspaceFolders = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolders) {
    updateStatus?.('[error] No workspace folders found.');
    return {
      status: 'error',
      result: 'No workspace folders found. Tell the user to open a workspace.',
    };
  }

  const dirPath = path.resolve(workspaceFolders.uri.fsPath, relativePath);

  try {
    // Attempt to list files using the FileOperationsProvider.
    const { filesList, limitReached } = await FileOperationsProvider.listFiles(
      dirPath,
      recursive,
      limit,
    );

    // Clear the status after the file listing is complete.
    updateStatus?.('');

    // Return the results in a structured format.
    return {
      status: 'success',
      result: limitReached
        ? `Listed files up to the limit of ${limit}. Here are the files:\n- ${filesList.join('\n- ')}\n(Note: The limit of ${limit} files was reached, and not all files may be displayed.)`
        : `Successfully listed all files in the directory. Here are the files:\n- ${filesList.join('\n- ')}`,
    };
  } catch (error) {
    // Catch and handle any errors that occur during file listing.
    updateStatus?.('[error] Failed to list files.');
    return {
      status: 'error',
      result: `Error listing files in directory: ${dirPath}. ${error instanceof Error ? error.message : 'Unknown error.'}`,
    };
  }
};
