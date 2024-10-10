type LineFilterArgs = {
  lines: AsyncGenerator<string>;
  fullStop: () => void;
};

/**
 * Filter to apply to lines before sending them to the model
 */
export type LineFilter = (args: LineFilterArgs) => AsyncGenerator<string>;

/**
 * Information about a language for autocompletion
 * @property topLevelKeywords - keywords that can be at the top level of the code
 * @property builtInFunctions - built-in functions for the language
 * @property commonLibraries - common libraries for the language
 * @property singleLineComment - the single line comment character for the language
 * @property endOfLine - characters that can be at the end of a line
 * @property stopWords - words that should not be included in completions
 * @property lineFilters - filters to apply to lines before sending them to the model
 * @property useMultiline - function to determine if the completion should be multiline
 */
export type ManuallyCompleteLanguageInfo = {
  topLevelKeywords: string[];
  builtInFunctions?: string[];
  commonLibraries?: string[];
  singleLineComment: string;
  endOfLine: string[];
  stopWords?: string[];
  lineFilters?: LineFilter[];
  useMultiline?: (args: {
    prefix: string;
    suffix: string;
  }) => boolean | undefined;
};
