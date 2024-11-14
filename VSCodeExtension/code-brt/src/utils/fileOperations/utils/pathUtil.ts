/**
 * This file contains code modify from repository cline, from the clinebot, which is licensed under
 * the Apache License, Version 2.0. You can obtain a copy of the Apache License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * The related file is located at:
 * https://github.com/cline/cline/blob/main/src/utils/path.ts
 */
import path from 'path';

/**
 * Normalize paths to a consistent format.
 * - Converts backslashes to forward slashes.
 * - Resolves relative segments (e.g., './', '../').
 */
const normalizePath = (p: string): string => {
  return path.normalize(p).replace(/\\/g, '/');
};

/**
 * Check if two paths are equal, accounting for platform-specific differences.
 * @param path1 - The first path to compare.
 * @param path2 - The second path to compare.
 * @returns True if the paths are equal, false otherwise.
 */
export const arePathsEqual = (path1?: string, path2?: string): boolean => {
  if (!path1 && !path2) {
    return true;
  }
  if (!path1 || !path2) {
    return false;
  }

  path1 = normalizePath(path1);
  path2 = normalizePath(path2);

  if (process.platform === 'win32') {
    return path1.toLowerCase() === path2.toLowerCase();
  }
  return path1 === path2;
};
