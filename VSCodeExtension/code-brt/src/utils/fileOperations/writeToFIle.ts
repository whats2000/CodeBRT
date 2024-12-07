import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { filePathExists } from './utils';

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

    // Write content to the file, overwriting if necessary
    await fs.writeFile(absolutePath, content);
    return {
      status: 'success',
      message: `File successfully written to ${filePath}.`,
    };
  } catch (error) {
    console.error(`Failed to write file at ${filePath}:`, error);
    return {
      status: 'error',
      message: `Failed to write file at ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
