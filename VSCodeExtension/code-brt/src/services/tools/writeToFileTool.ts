import path from 'path';

import vscode from 'vscode';

import type { ToolServicesApi } from './types';
import { FileOperationsProvider } from '../../utils';
import { detectCodeOmission } from './utils';

/**
 * Detects the End-of-Line (EOL) style of the given text
 * @param content The text to analyze
 * @returns 'CRLF' or 'LF'
 */
const detectEOLStyle = (content: string): 'CRLF' | 'LF' => {
  // Check if the content contains Windows-style line endings (CRLF)
  const crlfMatches = content.match(/\r\n/g);
  const lfMatches = content.match(/(?<!\r)\n/g);

  // Prefer CRLF if it's more prevalent, otherwise use LF
  if (crlfMatches && (!lfMatches || crlfMatches.length >= lfMatches.length)) {
    return 'CRLF';
  }
  return 'LF';
};

/**
 * Normalizes the content to use the specified EOL style
 * @param content The content to normalize
 * @param eolStyle The desired EOL style
 * @returns Content with consistent line endings
 */
const normalizeEOLStyle = (
  content: string,
  eolStyle: 'CRLF' | 'LF',
): string => {
  // First, normalize to LF
  const normalizedContent = content.replace(/\r\n/g, '\n');

  // Then convert to the desired style
  return eolStyle === 'CRLF'
    ? normalizedContent.replace(/\n/g, '\r\n')
    : normalizedContent;
};

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
  let originalEOLStyle: 'CRLF' | 'LF' = 'LF'; // Default to LF
  try {
    const document = await vscode.workspace.openTextDocument(filePath);
    existingContent = document.getText();

    // Detect the original EOL style
    originalEOLStyle = detectEOLStyle(existingContent);
  } catch (error) {
    existingContent = '';
  }

  // Save version before writing
  await vscode.commands.executeCommand('code-brt.saveFileVersion', filePath);

  let completeContent = content;

  // If the content is partial code, fuse it with the existing content
  // Sometime the LLM will wrongly predict the code as full code, so we need to check if it's partial again for safety
  if (isCodePartial || detectCodeOmission(existingContent, content)) {
    updateStatus?.('[processing] Inserting code snippet to file...');
    const result = await partialCodeFuser.fusePartialCode({
      originalCode: existingContent,
      partialCode: content,
      relativeFilePath: filePath,
    });

    if (result) {
      // Clear the ```fileExtension and ``` from the code block
      completeContent = result
        .replace(/^```.*\n/, '')
        .replace(/```\n$/, '')
        .replace(/```$/, '');
    } else {
      vscode.window.showErrorMessage(
        'The code fuser failed to fuse the partial code. Please manually check the file.',
      );
    }
  }

  // Normalize the content to match the original file's EOL style
  const normalizedContent = normalizeEOLStyle(
    completeContent,
    originalEOLStyle,
  );

  const { status, message } = await FileOperationsProvider.writeToFile(
    filePath,
    normalizedContent,
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
    normalizedContent,
  );

  return { status: 'success', result: message };
};
