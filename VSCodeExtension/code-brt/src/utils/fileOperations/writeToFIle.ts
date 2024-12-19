import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import deepEqual from 'fast-deep-equal';

import { filePathExists } from './utils';
import vscode from 'vscode';

/**
 * Format the diagnostics into a Markdown-friendly string, filtering errors only.
 * @param diagnostics - The diagnostics to format.
 */
const formatDiagnostics = (
  diagnostics: [vscode.Uri, vscode.Diagnostic[]][],
): string => {
  if (diagnostics.length === 0) return 'Without any diagnostics.';

  return diagnostics
    .map(([uri, diags]) => {
      const errorDiags = diags.filter(
        (diag) => diag.severity === vscode.DiagnosticSeverity.Error,
      );

      if (errorDiags.length === 0) return null; // Skip URIs with no errors.

      const diagMessages = errorDiags
        .map(
          (diag) =>
            `- **Message**: ${diag.message}\n` +
            `  - **Range**: Line ${diag.range.start.line + 1}, Column ${
              diag.range.start.character + 1
            }\n` +
            `  - **Code**: ${diag.code || 'N/A'}\n`,
        )
        .join('\n');

      return `With some diagnostics:\n\n### ${path.basename(uri.fsPath)}\n\n${diagMessages}`;
    })
    .filter(Boolean) // Remove URIs with no errors.
    .join('\n');
};

/**
 * Writes content to a file, with optional overwrite protection.
 * @param filePath - The path to the file.
 * @param content - The content to write to the file.
 * @param overwrite - Flag indicating whether to overwrite the file if it exists.
 * @returns A status message indicating success or failure.
 */
export const writeToFile = async (
  filePath: string,
  content: string,
  overwrite = false,
): Promise<{ status: 'success' | 'error'; message: string }> => {
  try {
    const absolutePath = path.resolve(filePath);
    const dirPath = path.dirname(absolutePath);

    // Ensure the directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Check if the file exists
    const isFileExists = await filePathExists(absolutePath);

    // If a file exists and overwrite is false, return an error message
    if (isFileExists && !overwrite) {
      return {
        status: 'error',
        message: `File already exists at ${filePath}. Use overwrite option to replace it.`,
      };
    }

    // Old diagnostics code
    const oldDiagnosticsMap = new Map(vscode.languages.getDiagnostics());

    // Write content to the file, overwriting if necessary
    await fs.writeFile(absolutePath, content);

    // Check for new diagnostics after writing the file
    // This logic refers to the `https://github.com/cline/cline/blob/main/src/integrations/diagnostics/index.ts`
    // From the `cline` repository under Apache-2.0 License
    const newDiagnostics = vscode.languages
      .getDiagnostics()
      .map(([uri, newDiags]) => {
        const oldDiags = oldDiagnosticsMap.get(uri) || [];
        const newProblems = newDiags.filter(
          (newDiag) => !oldDiags.some((oldDiag) => deepEqual(oldDiag, newDiag)),
        );
        return newProblems.length > 0 ? [uri, newProblems] : null;
      })
      .filter(Boolean) as [vscode.Uri, vscode.Diagnostic[]][];

    const diagnosticsMessage = formatDiagnostics(newDiagnostics);
    return {
      status: 'success',
      message:
        `File successfully written to ${filePath}. ` + diagnosticsMessage,
    };
  } catch (error) {
    console.error(`Failed to write file at ${filePath}:`, error);
    return {
      status: 'error',
      message: `Failed to write file at ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
