/**
 * This file contains code modify from repository continue, from the continuedev, which is licensed under
 * the Apache License, Version 2.0. You can obtain a copy of the Apache License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * The related file is located at:
 * https://github.com/continuedev/continue/blob/main/core/autocomplete/streamTransforms/lineStream.ts
 */
import { distance } from 'fastest-levenshtein';

const commonPrefixLength = (a: string, b: string): number => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) {
    i++;
  }
  return i;
};

/**
 * Determines if two lines of text are considered repeated or very similar.
 *
 * @param {string} a - The first line of text to compare.
 * @param {string} b - The second line of text to compare.
 * @returns {boolean} True if the lines are considered repeated, false otherwise.
 *
 * @description
 * This function checks if two lines are repeated or very similar based on two criteria:
 * 1. They have a common prefix longer than 12 characters.
 * 2. The Levenshtein distance between them is less than 10% of the length of the second line.
 * Lines shorter than 5 characters are never considered repeated.
 */
export const isLineRepeated = (a: string, b: string): boolean => {
  if (a.length <= 4 || b.length <= 4) {
    return false;
  }

  const aTrim = a.trim();
  const bTrim = b.trim();
  return (
    commonPrefixLength(aTrim, bTrim) > 12 ||
    distance(aTrim, bTrim) / bTrim.length < 0.1
  );
};
