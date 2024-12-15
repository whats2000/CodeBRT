import * as fs from 'node:fs/promises';
import path from 'path';

import pdf2md from '@opendocsg/pdf2md';
import mammoth from 'mammoth';
import { isBinaryFile } from 'isBinaryFile';

import { filePathExists } from './utils';

// Helper function to read PDF content
const readPdfContent = async (
  filePath: string,
): Promise<{
  status: 'success' | 'error';
  message: string;
}> => {
  try {
    const pdfData = await fs.readFile(filePath);
    const textContent = await pdf2md(pdfData);

    return {
      status: 'success',
      message: textContent,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Failed to read PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

// Helper function to read .docx content
const readDocxContent = async (
  filePath: string,
): Promise<{
  status: 'success' | 'error';
  message: string;
}> => {
  try {
    const { value: content } = await mammoth.extractRawText({ path: filePath });
    return {
      status: 'success',
      message: content,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Failed to read DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

// Helper function to read IPYNB content
const readNotebookContent = async (
  filePath: string,
  options = {
    maxCells: undefined,
    includeOutputs: true,
    trimSource: false,
    trimLength: 1024,
  }
): Promise<{
  status: 'success' | 'error';
  message: string;
}> => {
  const { maxCells, includeOutputs, trimSource, trimLength = 500 } = options;

  try {
    const notebookJson = await fs.readFile(filePath, 'utf-8');
    const notebook = JSON.parse(notebookJson);

    // Safely parse notebook cells
    const cells = Array.isArray(notebook.cells) ? notebook.cells : [];
    const limitedCells = maxCells ? cells.slice(0, maxCells) : cells;

    // Process each cell
    const notebookContent = limitedCells
      .map((cell: any, index: number) => {
        const cellType = cell.cell_type?.toUpperCase() || 'UNKNOWN';

        // Process cell source
        let source =
          Array.isArray(cell.source) && cell.source.length > 0
            ? cell.source.join('')
            : '[EMPTY CELL]';

        // Trim source if needed
        if (trimSource && source.length > trimLength) {
          source = source.slice(0, trimLength) + '... [TRIMMED]';
        }

        let outputSection = '';
        if (includeOutputs && cellType === 'CODE' && Array.isArray(cell.outputs)) {
          const outputs = cell.outputs.map((output: any, i: number) => {
            // Capture text outputs or errors
            const outputText = output.text
              || output.data?.['text/plain']
              || output.traceback?.join('\n') // For error traceback
              || '[NO OUTPUT]';

            const outputType = output.output_type?.toUpperCase() || 'UNKNOWN';
            return `  - OUTPUT ${i + 1} (${outputType}):\n    ${
              Array.isArray(outputText) ? outputText.join('') : outputText
            }`;
          });
          outputSection = outputs.length > 0 ? `\nOutputs:\n${outputs.join('\n')}` : '\nOutputs:\n[NO OUTPUTS]';
        }

        return `[CELL ${index + 1}] (${cellType}):\n${source}${outputSection}\n`;
      })
      .join('\n---\n');

    return {
      status: 'success',
      message: notebookContent,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Failed to read IPYNB file: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
};

/**
 * Reads content from a file and handles specific file types.
 * @param filePath - The path to the file.
 * @returns An object with the status and either file content or an error message.
 */
export const readFile = async (
  filePath: string,
): Promise<{
  status: 'success' | 'error';
  message: string;
}> => {
  try {
    const absolutePath = path.resolve(filePath);

    // Check if the file exists
    const isFileExists = await filePathExists(absolutePath);
    if (!isFileExists) {
      return {
        status: 'error',
        message: `File does not exist at ${filePath}.`,
      };
    }

    // Determine the file type by extension
    const fileExtension = path.extname(filePath).toLowerCase();

    switch (fileExtension) {
      case '.pdf':
        return await readPdfContent(absolutePath);
      case '.docx':
        return await readDocxContent(absolutePath);
      case '.ipynb':
        return await readNotebookContent(absolutePath);
      default:
        // Check if the file is binary
        if (await isBinaryFile(absolutePath)) {
          return {
            status: 'error',
            message: `The file ${filePath} is a binary file and cannot be read as text.`,
          };
        }

        const content = await fs.readFile(absolutePath, 'utf-8');
        return { status: 'success', message: content };
    }
  } catch (error) {
    console.error(`Failed to read file at ${filePath}:`, error);
    return {
      status: 'error',
      message: `Failed to read file at ${filePath}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
};
