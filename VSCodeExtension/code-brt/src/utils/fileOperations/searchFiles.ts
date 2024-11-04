import fs from 'node:fs/promises';
import { globby } from 'globby';
import path from 'node:path';
import { filePathExists } from './utils';

/**
 * Searches for files in a specified directory with options for filtering by regex and file patterns.
 * @param params - The parameters for the search, matching the schema.
 * @param currentWorkspacePath - The workspace root path for relative paths.
 * @returns The status and list of matched file paths or an error message.
 */
export const searchFiles = async (
  params: {
    relativePath: string;
    regex: string;
    filePattern?: string;
  },
  currentWorkspacePath: string,
): Promise<{
  status: 'success' | 'error';
  results?: string[];
  message?: string;
}> => {
  const { relativePath, regex, filePattern = '*' } = params;

  try {
    const absolutePath = path.resolve(currentWorkspacePath, relativePath);

    // Verify the directory exists
    if (!(await filePathExists(absolutePath))) {
      return {
        status: 'error',
        message: `Directory does not exist at ${absolutePath}.`,
      };
    }

    // Build the globby options
    const options = {
      cwd: absolutePath,
      absolute: true,
      onlyFiles: true,
      gitignore: true,
      ignore: ['**/node_modules', '**/.git', '**/dist', '**/build', '**/tmp'],
    };

    // Perform a file search based on the glob pattern
    const files = await globby(filePattern, options);

    // Compile the regular expression for content matching
    const regexPattern = new RegExp(regex, 'g');

    const matchedFiles: string[] = [];

    // Read and search content in each file for regular expression matches
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (regexPattern.test(content)) {
        matchedFiles.push(path.relative(currentWorkspacePath, file));
      }
    }

    return {
      status: 'success',
      results: matchedFiles,
    };
  } catch (error) {
    console.error(`Error in searchFiles: ${error}`);
    return {
      status: 'error',
      message: `Failed to perform search: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
};
