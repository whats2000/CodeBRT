import { ToolServicesApi } from './types';
import { CodeParserProvider } from '../codeParser';
import vscode from 'vscode';
import path from 'path';

export const listCodeDefinitionNamesTool: ToolServicesApi['listCodeDefinitionNames'] =
  async ({ relativePath, updateStatus }) => {
    const workspaceFolders = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolders) {
      updateStatus?.('[error] No workspace folders found.');
      return {
        status: 'error',
        result:
          'No workspace folders found. Tell the user to open a workspace.',
      };
    }

    updateStatus?.('[processing] Listing code definition names...');

    const dirPath = path.resolve(workspaceFolders.uri.fsPath, relativePath);

    const parseResult = await CodeParserProvider.generateCodeContext(dirPath);

    updateStatus?.('');

    if (parseResult.length === 0) {
      return {
        status: 'success',
        result: `No code definition names found in directory: "${relativePath}".`,
      };
    }

    // Format the result to display the code definition names to large language models.
    const codeDefinitionNames = parseResult
      .map(({ fileName, structure }) => {
        return `File: ${fileName}\n${structure}`;
      })
      .join('\n');

    return {
      status: 'success',
      result: `Listed code definition names in the directory. Here are the code definition names:\n${codeDefinitionNames}`,
    };
  };
