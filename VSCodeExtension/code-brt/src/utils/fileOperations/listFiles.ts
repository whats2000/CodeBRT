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

  // For partial substring matching, we'll check path.includes(userPattern)
  // But if user didn't supply anything, treat it as "*"
  const substring = userPattern || '';

  // Globby base options for a single-level listing
  const baseOptions: Options = {
    cwd: '', // We’ll change cwd dynamically
    dot: true,
    absolute: true,
    markDirectories: true,
    onlyFiles: false,
    gitignore: false, // We'll handle ignore logic ourselves
  };

  // BFS queue
  const queue: string[] = [absolutePath];
  const results: string[] = [];
  const visited: Set<string> = new Set(); // to avoid duplicates or loops

  while (queue.length > 0 && results.length < limit) {
    const currentDir = queue.shift()!;
    if (visited.has(currentDir)) {
      continue;
    }
    visited.add(currentDir);

    // Single-level glob inside currentDir
    const options: Options = {
      ...baseOptions,
      cwd: currentDir,
      ignore: DIRS_TO_IGNORE, // apply your ignore list
    };

    // get all items (files + directories) at this level
    const items = await globby('*', options);

    for (const item of items) {
      if (results.length >= limit) break;

      // If the item ends with '/', it's a directory
      const isDirectory = item.endsWith('/');
      if (isDirectory && recursive) {
        // Enqueue subdirectory for deeper BFS
        queue.push(item);
      }

      // Substring match check
      // (We always do this check; either the user typed something or substring is empty)
      if (item.includes(substring)) {
        results.push(item);
      }
    }
  }

  // Convert absolute paths in results to relative, if needed
  const relativeFiles = results.map((file) =>
    path.relative(absolutePath, file),
  );

  return {
    limitReached: results.length >= limit,
    filesList: relativeFiles,
    absoluteFilesList: results,
  };
}
