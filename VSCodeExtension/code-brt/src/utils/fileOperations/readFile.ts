import * as fs from 'node:fs/promises';
import path from 'path';

// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse';
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
    const textContent = (await pdf(pdfData)).text;

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
): Promise<{
  status: 'success' | 'error';
  message: string;
}> => {
  try {
    const notebookJson = await fs.readFile(filePath, 'utf-8');
    const notebook = JSON.parse(notebookJson);
    const notebookContent = notebook.cells
      .map((cell: any, index: number) => {
        const cellType = cell.cell_type.toUpperCase();
        const source = cell.source.join('');
        return `[CELL ${index + 1}](${cellType}):\n${source}\n`;
      })
      .join('\n---\n');

    return {
      status: 'success',
      message: notebookContent,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Failed to read IPYNB file: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
