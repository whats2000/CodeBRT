import path from 'path';

import vscode from 'vscode';

import type { ToolServicesApi } from './types';
import { FileOperationsProvider } from '../../utils';
import { detectCodeOmission } from './utils';

/**
 * Detects the End-of-Line (EOL) style of the given text
 * @param content The text to analyze
 * @returns Object containing EOL style and trailing newline info
 */
const detectEOLStyle = (
  content: string,
): {
  style: 'CRLF' | 'LF';
  hasTrailingNewline: boolean;
} => {
  // Check if the content contains Windows-style line endings (CRLF)
  const crlfMatches = content.match(/\r\n/g);
  const lfMatches = content.match(/(?<!\r)\n/g);

  // Determine the predominant line ending style
  const style =
    crlfMatches && (!lfMatches || crlfMatches.length >= lfMatches.length)
      ? 'CRLF'
      : 'LF';

  // Check for trailing newline
  const hasTrailingNewline =
    style === 'CRLF' ? content.endsWith('\r\n') : content.endsWith('\n');

  return { style, hasTrailingNewline };
};

/**
 * Normalizes the content to use the specified EOL style and trailing newline
 * @param content The content to normalize
 * @param eolStyle The desired EOL style
 * @param shouldHaveTrailingNewline Whether to add/preserve trailing newline
 * @returns Content with consistent line endings
 */
const normalizeEOLStyle = (
  content: string,
  eolStyle: 'CRLF' | 'LF',
  shouldHaveTrailingNewline: boolean,
): string => {
  // Ensure the content ends with a single newline if required
  let normalizedContent = content.replace(/\r\n/g, '\n');

  // Remove any existing trailing newlines if not needed
  if (!shouldHaveTrailingNewline) {
    normalizedContent = normalizedContent.replace(/\n+$/, '');
  } else {
    // Ensure exactly one newline at the end
    normalizedContent = normalizedContent.replace(/\n+$/, '\n');
  }

  // Convert to the desired line ending style
  return eolStyle === 'CRLF'
    ? shouldHaveTrailingNewline
      ? normalizedContent.replace(/\n/g, '\r\n')
      : normalizedContent.trimEnd()
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
  let originalEOLStyle: 'CRLF' | 'LF'; // Default to LF
  let hasOriginalTrailingNewline: boolean; // Default to true to preserve newline

  try {
    const document = await vscode.workspace.openTextDocument(filePath);
    existingContent = document.getText();

    // Detect the original EOL style and trailing newline
    const eolInfo = detectEOLStyle(existingContent);
    originalEOLStyle = eolInfo.style;
    hasOriginalTrailingNewline = eolInfo.hasTrailingNewline;
  } catch (error) {
    existingContent = '';
    // If the file doesn't exist, default to LF with trailing newline
    originalEOLStyle = 'LF';
    hasOriginalTrailingNewline = true;
  }

  // Save version before writing
  await vscode.commands.executeCommand('code-brt.saveFileVersion', filePath);

  let completeContent = content;

  // If the content is partial code, fuse it with the existing content
  if (isCodePartial || detectCodeOmission(existingContent, content)) {
    updateStatus?.('[processing] Inserting code snippet to file...');
    const result = await partialCodeFuser.fusePartialCode({
      originalCode: existingContent,
      partialCode: content,
      relativeFilePath: filePath,
    });

    if (result) {
      // Clear the ```fileExtension and ``` from the code block
      // This regular expression will capture everything between a pair of triple backticks
      // (with optional language spec) and store it in 'codeBlockContent'.
      // Use the global flag 'g' to find all code blocks
      const startIndex = result.indexOf('```');
      if (startIndex !== -1) {
        const endIndex = result.lastIndexOf('```');

        // Ensure that we have a closing backtick after the starting one
        if (endIndex !== -1 && endIndex > startIndex) {
          // Extract everything between the first and last triple backticks
          let substring = result.substring(startIndex + 3, endIndex);

          // Now remove the language spec line if present.
          // The first line in 'substring' (up to the first newline) could be the language spec.
          const firstNewlineIndex = substring.indexOf('\n');
          if (firstNewlineIndex !== -1) {
            // Remove the language spec line by taking everything after the first newline
            completeContent = substring.substring(firstNewlineIndex + 1);
          } else {
            // No newline after the triple backticks line, just use as is
            completeContent = substring;
          }
        } else {
          // If there's no proper closing triple backticks after the start
          completeContent = result;
        }
      } else {
        // If there are no triple backticks at all
        completeContent = result;
      }
    } else {
      vscode.window.showErrorMessage(
        'The code fuser failed to fuse the partial code. Please manually check the file.',
      );
    }
  }

  // Normalize the content to match the original file's EOL style and trailing newline
  const normalizedContent = normalizeEOLStyle(
    completeContent,
    originalEOLStyle,
    hasOriginalTrailingNewline,
  );

  const { status, message } = await FileOperationsProvider.writeToFile(
    filePath,
    normalizedContent,
    true,
    updateStatus,
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
