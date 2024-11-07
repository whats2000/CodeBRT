/**
 * This file contains code modify from repository cline, from the clinebot, which is licensed under
 * the Apache License, Version 2.0. You can obtain a copy of the Apache License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * The related file is located at:
 * https://github.com/cline/cline/blob/main/src/services/glob/list-files.ts
 */
import { globby, Options } from 'globby';
import os from 'os';
import * as path from 'path';

import { arePathsEqual } from './utils';
import { DIRS_TO_IGNORE } from './constants';

/**
 * Breadth-first level-by-level file listing up to a specified limit.
 * @param limit - Maximum number of files to collect.
 * @param options - Globby options.
 * @returns Array of file paths collected up to the specified limit.
 */
const globbyLevelByLevel = async (
  limit: number,
  options?: Options,
): Promise<string[]> => {
  const results: Set<string> = new Set();
  const queue: string[] = ['*']; // Start with a top-level pattern

  // Core process for level-by-level file discovery
  const globbingProcess = async () => {
    while (queue.length > 0 && results.size < limit) {
      const pattern = queue.shift()!;
      const filesAtLevel = await globby(pattern, options);

      for (const file of filesAtLevel) {
        if (results.size >= limit) break;
        results.add(file);

        if (file.endsWith('/')) {
          // Queue subdirectories for next level
          queue.push(`${file}*`);
        }
      }
    }
    return Array.from(results).slice(0, limit);
  };

  // Timeout to prevent hanging globbing operations
  const timeoutPromise = new Promise<string[]>((_, reject) => {
    setTimeout(() => reject(new Error('Globbing timeout')), 10_000);
  });

  try {
    return await Promise.race([globbingProcess(), timeoutPromise]);
  } catch (error) {
    console.warn('Globbing timed out, returning partial results');
    return Array.from(results);
  }
};

/**
 * List files in a directory with blacklist filtering, recursion, and file limit.
 * @param dirPath - The directory path to list files from.
 * @param recursive - Whether to list files recursively.
 * @param limit - The maximum number of files to return.
 * @returns An array containing the list of files and a boolean indicating if the limit was reached.
 */
export const listFiles = async (
  dirPath: string,
  recursive: boolean,
  limit: number,
): Promise<{ limitReached: boolean; filesList: string[] }> => {
  const absolutePath = path.resolve(dirPath);

  // Restrict listing files in the root or home directory
  const root =
    process.platform === 'win32' ? path.parse(absolutePath).root : '/';
  if (
    arePathsEqual(absolutePath, root) ||
    arePathsEqual(absolutePath, os.homedir())
  ) {
    return { limitReached: false, filesList: [absolutePath] };
  }

  // Set globby options based on whether recursive search is requested
  const options: Options = {
    cwd: dirPath,
    dot: true, // Include hidden files and directories
    absolute: true, // Return absolute paths
    markDirectories: true, // Append `/` to directories
    gitignore: recursive, // Use .gitignore when recursive is true
    ignore: recursive ? DIRS_TO_IGNORE : undefined, // Ignore specified directories
    onlyFiles: false, // Include directories in the result
  };

  // Perform depth-limited globbing to get files up to the specified limit
  const files = recursive
    ? await globbyLevelByLevel(limit, options)
    : (await globby('*', options)).slice(0, limit);

  return { limitReached: files.length >= limit, filesList: files };
};
