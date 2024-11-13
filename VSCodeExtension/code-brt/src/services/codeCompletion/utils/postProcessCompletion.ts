/**
 * This file contains code modify from repository continue, from the continuedev, which is licensed under
 * the Apache License, Version 2.0. You can obtain a copy of the Apache License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * The related file is located at:
 * https://github.com/continuedev/continue/blob/main/core/autocomplete/postprocessing.ts
 */
import { isLineRepeated } from './lineUtils';
import { longestCommonSubsequence } from '../../../utils';

const MAX_REPETITION_FREQ_TO_CHECK = 3;

/**
 * Check if the first line of completion rewrites the line above it
 * @param completion - Generated completion string
 * @param prefix - The prefix leading to the completion
 * @returns {boolean} - Whether the completion rewrites the last line of the prefix
 */
const isRewritesLineAbove = (completion: string, prefix: string): boolean => {
  const lineAbove = prefix
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .slice(-1)[0];
  if (!lineAbove) {
    return false;
  }

  const firstLineOfCompletion = completion
    .split('\n')
    .find((line) => line.trim().length > 0);
  if (!firstLineOfCompletion) {
    return false;
  }

  return isLineRepeated(lineAbove, firstLineOfCompletion);
};

/**
 * Check if the completion contains extreme repetition of lines based on their relative positions
 * @param completion - Generated completion string
 * @returns {boolean} - Whether extreme repetition is detected
 */
const isExtremeRepetition = (completion: string): boolean => {
  const lines = completion.trim().split('\n');
  if (lines.length < 6) {
    return false;
  }
  for (let freq = 1; freq < MAX_REPETITION_FREQ_TO_CHECK; freq++) {
    const lcs = longestCommonSubsequence(lines[0].trim(), lines[freq].trim());
    if (lcs.length > 5 || lcs.length > lines[0].length * 0.5) {
      let matchCount = 0;
      for (let i = 0; i < lines.length; i += freq) {
        if (lines[i].includes(lcs)) {
          matchCount++;
        }
      }
      if (matchCount * freq > 8 || (matchCount * freq) / lines.length > 0.8) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Post-process the completion result
 * @param completion - The raw completion result string
 * @param prefix - The preceding context string
 * @param suffix - The succeeding context string
 * @param modelName - The name of the language model used
 * @returns {string | null} - The processed completion, or null if it should be filtered out
 */
export const postProcessCompletion = (
  completion: string,
  prefix: string,
  suffix: string,
  modelName: string,
): string | null => {
  // Don't return empty completions
  /**
   * Filter out empty completions
   * @example
   * completion: "   "
   * result: null
   */
  if (completion.trim().length <= 0) {
    return null;
  }

  const lastLineOfPrefix = prefix.split('\n').slice(-1)[0]?.trim() || '';

  /**
   * If the completion starts with the last line of the prefix, remove it
   * @example
   * prefix: "  const numberX = "
   * completion: "  const numberX = 5;"
   * result: "5;"
   */
  if (completion.startsWith(lastLineOfPrefix)) {
    completion = completion.slice(lastLineOfPrefix.length);
  }

  /**
   * If the last line of the prefix is empty or contains only spaces, remove leading '\n' in the completion
   * @example
   * prefix: "  \n"
   * completion: "\nconst result = 5;"
   * result: "const result = 5;"
   */
  if (!lastLineOfPrefix || lastLineOfPrefix.trim() === '') {
    completion = completion.replace(/^\n+/, '');
  }

  /**
   * If the completion ends with the first line of the suffix, remove it
   * @example
   * suffix: "return x;"
   * completion: "const x = 5;\nreturn x;"
   * result: "const x = 5;"
   */
  const firstLineOfSuffix = suffix
    .split('\n')
    .find((line) => line.trim().length > 0);
  if (firstLineOfSuffix && completion.endsWith(firstLineOfSuffix)) {
    completion = completion.slice(0, -firstLineOfSuffix.length);
  }

  /**
   * Filter if the first line rewrites the previous line
   * @example
   * prefix: "const x = 5;"
   * completion: "const x = 5;"
   * result: null
   */
  if (isRewritesLineAbove(completion, prefix)) {
    return null;
  }

  /**
   * Filter out completions with extreme repetition of lines
   * @example
   * completion: "const x = 5;\nconst x = 5;\nconst x = 5;"
   * result: null
   */
  if (isExtremeRepetition(completion)) {
    return null;
  }

  // Remove trailing whitespace
  completion = completion.trimEnd();

  /**
   * Handle model-specific cases (e.g., "codestral")
   * @example
   * modelName: "codestral"
   * prefix: "const x = 5; "
   * completion: " const y = 10;"
   * result: "const y = 10;"
   */
  if (modelName.toLowerCase().includes('codestral')) {
    // Codestral sometimes starts with an extra space
    if (completion.startsWith(' ') && completion[1] !== ' ') {
      if (prefix.endsWith(' ') && suffix.startsWith('\n')) {
        completion = completion.slice(1);
      }
    }
  }

  /**
   * If completion starts with multiple whitespaces but the cursor is at the end of the line
   * @example
   * prefix: "const x = 5;"
   * completion: "  const y = 10;"
   * suffix: "\n"
   * result: null
   */
  if (
    (completion.startsWith('  ') || completion.startsWith('\t')) &&
    !prefix.endsWith('\n') &&
    (suffix.startsWith('\n') || suffix.trim().length === 0)
  ) {
    return null;
  }

  /**
   * If the prefix ends with a space and so does completion, remove the space from the completion
   * @example
   * prefix: "const x = 5; "
   * completion: " const y = 10;"
   * result: "const y = 10;"
   */
  if (prefix.endsWith(' ') && completion.startsWith(' ')) {
    completion = completion.slice(1);
  }

  return completion;
};
