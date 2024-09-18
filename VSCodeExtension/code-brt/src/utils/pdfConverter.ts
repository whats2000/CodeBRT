import fs from 'fs';
import path from 'path';

import * as vscode from 'vscode';
import pdf2md from '@opendocsg/pdf2md';

/**
 * Convert a PDF file to Markdown format.
 * @param pdfFilePath - The path to the PDF file.
 * @returns A promise that resolves with the converted Markdown content.
 */
export async function convertPdfToMarkdown(
  pdfFilePath: string,
): Promise<string> {
  if (!fs.existsSync(pdfFilePath)) {
    throw new Error(`File not found: ${pdfFilePath}`);
  }

  try {
    const pdfBuffer = fs.readFileSync(pdfFilePath);
    return await pdf2md(pdfBuffer);
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to convert PDF to Markdown: ${error}`,
    );
    return `Failed to convert PDF named ${path.basename(pdfFilePath)}.`;
  }
}
