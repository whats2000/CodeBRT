import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { filePathExists } from './utils';
import vscode from 'vscode';
import { DiagnosticsProvider } from '../../integrations';

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

    await fs.mkdir(dirPath, { recursive: true });

    const isFileExists = await filePathExists(absolutePath);
    if (isFileExists && !overwrite) {
      return {
        status: 'error',
        message: `File already exists at ${filePath}. Use overwrite option to replace it.`,
      };
    }

    // Capture old diagnostics specifically for this file’s URI
    const targetUri = vscode.Uri.file(absolutePath);
    const oldDiagnostics = vscode.languages.getDiagnostics(targetUri);

    await fs.writeFile(absolutePath, content);
    const document = await vscode.workspace.openTextDocument(filePath);
    let fileSaveSuccess = false;
    let retries = 0;

    // Try to save the file until it is saved successfully as this will update the diagnostics
    while (!fileSaveSuccess && retries < 5) {
      fileSaveSuccess = await document.save();
      await new Promise((resolve) => setTimeout(resolve, 200));
      retries++;
    }

    await vscode.window.showTextDocument(document);

    let newDiagnostics = oldDiagnostics;
    // As we need save to be successful to get updated diagnostics, we will skip diagnostics check if save fails
    if (fileSaveSuccess) {
      // Instead of immediately checking diagnostics, set up a listener for when they change
      let resolveDiagnostics: (value: vscode.Diagnostic[]) => void;
      const diagnosticsPromise = new Promise<vscode.Diagnostic[]>((resolve) => {
        resolveDiagnostics = resolve;
      });

      const diagnosticsListener = vscode.languages.onDidChangeDiagnostics(
        (e) => {
          // Check if the changed diagnostics include our document
          if (e.uris.some((uri) => uri.toString() === targetUri.toString())) {
            const updatedDiagnostics =
              vscode.languages.getDiagnostics(targetUri);
            // Once we have updated diagnostics, resolve the promise and dispose the listener
            resolveDiagnostics(updatedDiagnostics);
            diagnosticsListener.dispose();
          }
        },
      );

      // Wait for diagnostics to be updated
      newDiagnostics = await diagnosticsPromise;
    }

    // Compare old and new diagnostics
    const newDiagnosticsMap = new Map([[targetUri, newDiagnostics]]);
    const oldDiagnosticsMap = new Map([[targetUri, oldDiagnostics]]);

    const deltaDiagnostics = DiagnosticsProvider.getDeltaDiagnostics(
      oldDiagnosticsMap,
      newDiagnosticsMap,
    );

    const filteredDiagnostics = DiagnosticsProvider.filterDiagnosticsBySeverity(
      deltaDiagnostics,
      vscode.DiagnosticSeverity.Error,
    );

    // When the file is saved successfully, show the diagnostics message otherwise show a generic message
    const diagnosticsMessage = !fileSaveSuccess
      ? 'With unknown diagnostics status.'
      : DiagnosticsProvider.formatDiagnostics(filteredDiagnostics);

    return {
      status: 'success',
      message: `File successfully written to ${filePath}. ${diagnosticsMessage}`,
    };
  } catch (error) {
    console.error(`Failed to write file at ${filePath}:`, error);
    return {
      status: 'error',
      message: `Failed to write file at ${filePath}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
};
