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
 * Unify slashes in a string to forward slashes for directory listing.
 * @param str - The string to replace backslashes in.
 */
const unifySlashes = (str: string): string => {
  return str.replace(/\\/g, '/');
};

/**
 * List files in a directory with blacklist filtering, recursion, and file limit.
 * @param dirPath - The directory path to list files from.
 * @param recursive - Whether to list files recursively.
 * @param limit - The maximum number of files to return.
 * @param userPattern - Glob pattern to start with.
 * @returns An array containing the list of files and a boolean indicating if the limit was reached.
 */
export async function listFiles(
  dirPath: string,
  recursive: boolean,
  limit: number,
  userPattern: string = '',
) {
  const absolutePath = path.resolve(dirPath);
  const root =
    process.platform === 'win32' ? path.parse(absolutePath).root : '/';

  // Guard: don't let user list home directory or root
  if (
    arePathsEqual(absolutePath, root) ||
    arePathsEqual(absolutePath, os.homedir())
  ) {
    const relativePath = path.relative(root, absolutePath);
    return {
      limitReached: false,
      filesList: [relativePath],
      absoluteFilesList: [absolutePath],
    };
  }

  // Normalize the user pattern so any backslashes -> forward slashes
  const normalizedPattern = unifySlashes(userPattern);

  const baseOptions: Options = {
    cwd: '',
    dot: true,
    absolute: true,
    markDirectories: true,
    onlyFiles: false,
    gitignore: false,
  };

  const queue: string[] = [absolutePath];
  const results: string[] = [];
  const visited: Set<string> = new Set();

  while (queue.length > 0 && results.length < limit) {
    const currentDir = queue.shift()!;
    if (visited.has(currentDir)) {
      continue;
    }
    visited.add(currentDir);

    const options: Options = {
      ...baseOptions,
      cwd: currentDir,
      ignore: DIRS_TO_IGNORE,
    };

    // Single-level glob in this directory
    const items = await globby('*', options);

    for (const item of items) {
      if (results.length >= limit) break;

      const isDirectory = item.endsWith('/');
      if (isDirectory && recursive) {
        queue.push(item);
      }

      // Normalize the discovered path
      const normalizedItem = unifySlashes(item);

      // If the user's pattern is empty, everything matches;
      // otherwise, check substring with normalized slashes
      if (!normalizedPattern || normalizedItem.includes(normalizedPattern)) {
        results.push(item);
      }
    }
  }

  const relativeFiles = results.map((file) =>
    path.relative(absolutePath, file),
  );

  return {
    limitReached: results.length >= limit,
    filesList: relativeFiles,
    absoluteFilesList: results,
  };
}
