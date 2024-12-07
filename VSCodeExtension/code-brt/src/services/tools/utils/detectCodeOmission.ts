/**
 * This file contains code modify from repository cline, from the clinebot, which is licensed under
 * the Apache License, Version 2.0. You can obtain a copy of the Apache License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * The related file is located at:
 * https://github.com/cline/cline/blob/main/src/integrations/editor/detect-omission.ts
 */

import vscode from 'vscode';

/**
 * Detects potential AI-generated code omissions in the given file content.
 * @param originalFileContent The original content of the file.
 * @param newFileContent The new content of the file to check.
 * @returns True if a potential omission is detected, false otherwise.
 */
export function detectCodeOmission(
  originalFileContent: string,
  newFileContent: string,
): boolean {
  const originalLines = originalFileContent.split('\n');
  const newLines = newFileContent.split('\n');
  const omissionKeywords = [
    'remain',
    'remains',
    'unchanged',
    'rest',
    'previous',
    'existing',
    '...',
  ];

  const commentPatterns = [
    /^\s*\/\//, // Single-line comment for most languages
    /^\s*#/, // Single-line comment for Python, Ruby, etc.
    /^\s*\/\*/, // Multi-line comment opening
    /^\s*{\s*\/\*/, // JSX comment opening
    /^\s*<!--/, // HTML comment opening
  ];

  for (const line of newLines) {
    if (commentPatterns.some((pattern) => pattern.test(line))) {
      const words = line.toLowerCase().split(/\s+/);
      if (omissionKeywords.some((keyword) => words.includes(keyword))) {
        if (!originalLines.includes(line)) {
          void vscode.window.showWarningMessage(
            `Potential AI-generated code omission detected: "${line}"`,
          );

          return true;
        }
      }
    }
  }

  return false;
}
