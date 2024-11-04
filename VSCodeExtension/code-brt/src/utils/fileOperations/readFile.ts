import * as fs from 'node:fs/promises';
import path from 'path';

import { fileExists } from './utils';

/**
 * Reads content from a file.
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
    const isFileExists = await fileExists(absolutePath);
    if (!isFileExists) {
      return {
        status: 'error',
        message: `File does not exist at ${absolutePath}.`,
      };
    }

    // Read content from the file
    const content = await fs.readFile(absolutePath, 'utf-8');
    return {
      status: 'success',
      message: content,
    };
  } catch (error) {
    console.error(`Failed to read file at ${filePath}:`, error);
    return {
      status: 'error',
      message: `Failed to read file at ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
