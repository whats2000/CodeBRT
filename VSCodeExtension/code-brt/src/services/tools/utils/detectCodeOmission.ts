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
export const detectCodeOmission = (
  originalFileContent: string,
  newFileContent: string,
): boolean => {
  const originalLines = originalFileContent.split('\n');
  const newLines = newFileContent.split('\n');

  const omissionPatterns = [
    // These can be substrings or entire words that commonly appear when LLMs skip code
    '... (rest omitted)',
    '... (remaining code unchanged)',
    'rest remains unchanged',
    'remaining code is the same',
    'previous code unchanged',
    'existing code unchanged',
    '...',
    'unchanged',
    'remain',
  ];

  // Common comment starters in various languages
  const commentPatterns = [
    /^\s*\/\//, // Single-line comment for C-like languages
    /^\s*#/, // Single-line comment for Python, Ruby, Shell
    /^\s*\/\*/, // Start of block comment for C-like
    /^\s*\{\s*\/\*/, // JSX block comment start
    /^\s*<!--/, // HTML/XML comment start
  ];

  // Helper to determine if a line is a comment line
  const isCommentLine = (line: string): boolean => {
    return commentPatterns.some((pattern) => pattern.test(line));
  };

  // Helper to detect any of the omission patterns in a line (case-insensitive)
  const containsOmissionPattern = (line: string): boolean => {
    const lowerLine = line.toLowerCase();
    return omissionPatterns.some((omission) =>
      lowerLine.includes(omission.toLowerCase()),
    );
  };

  for (const line of newLines) {
    // Check if it's a comment line
    if (!isCommentLine(line.trim())) {
      continue;
    }
    if (!containsOmissionPattern(line)) {
      continue;
    }
    if (!originalLines.includes(line)) {
      void vscode.window.showWarningMessage(
        `Potential AI-generated code omission detected: "${line.trim()}"`,
      );
      return true;
    }
  }

  return false;
};
