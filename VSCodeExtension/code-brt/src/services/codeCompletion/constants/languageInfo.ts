import { ManuallyCompleteLanguageInfo } from '../../../types';

export const Typescript: ManuallyCompleteLanguageInfo = {
  topLevelKeywords: ['function', 'class', 'module', 'export', 'import'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// Python
export const Python: ManuallyCompleteLanguageInfo = {
  // """"#" is for .ipynb files, where we add '"""' surrounding markdown blocks.
  // This stops the model from trying to complete the start of a new markdown block
  topLevelKeywords: ['def', 'class', '"""#'],
  singleLineComment: '#',
  endOfLine: [],
};

// Java
export const Java: ManuallyCompleteLanguageInfo = {
  topLevelKeywords: ['class', 'function'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// C++
export const Cpp: ManuallyCompleteLanguageInfo = {
  topLevelKeywords: ['class', 'namespace', 'template'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// C#
export const CSharp: ManuallyCompleteLanguageInfo = {
  topLevelKeywords: ['class', 'namespace', 'void'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// C
export const C: ManuallyCompleteLanguageInfo = {
  topLevelKeywords: ['if', 'else', 'while', 'for', 'switch', 'case'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// PHP
export const PHP: ManuallyCompleteLanguageInfo = {
  topLevelKeywords: ['function', 'class', 'namespace', 'use'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// Ruby
export const Ruby: ManuallyCompleteLanguageInfo = {
  topLevelKeywords: ['class', 'module', 'def'],
  singleLineComment: '#',
  endOfLine: [],
};

// Clojure
export const Clojure: ManuallyCompleteLanguageInfo = {
  topLevelKeywords: ['def', 'fn', 'let', 'do', 'if', 'defn', 'ns', 'defmacro'],
  singleLineComment: ';',
  endOfLine: [],
};

// R
export const R: ManuallyCompleteLanguageInfo = {
  topLevelKeywords: [
    'function',
    'if',
    'else',
    'for',
    'while',
    'repeat',
    'library',
    'require',
  ],
  singleLineComment: '#',
  endOfLine: [],
};

// YAML
export const YAML: ManuallyCompleteLanguageInfo = {
  topLevelKeywords: [],
  singleLineComment: '#',
  endOfLine: [],
  lineFilters: [
    // Only display one list item at a time
    async function* ({ lines, fullStop }) {
      let seenListItem = false;
      for await (const line of lines) {
        if (line.trim().startsWith('- ')) {
          if (seenListItem) {
            fullStop();
            break;
          } else {
            seenListItem = true;
          }
          yield line;
        } else {
          yield line;
        }
      }
    },
    // Don't allow consecutive lines of same key
    async function* ({ lines }) {
      let lastKey = undefined;
      for await (const line of lines) {
        if (line.includes(':')) {
          const key = line.split(':')[0];
          if (key !== lastKey) {
            yield line;
            lastKey = key;
          } else {
            break;
          }
        }
      }
    },
  ],
};

//Markdown
export const Markdown: ManuallyCompleteLanguageInfo = {
  topLevelKeywords: [],
  singleLineComment: '',
  endOfLine: [],
  useMultiline: ({ prefix }) => {
    const singleLineStarters = ['- ', '* ', /^\d+\. /, '> ', '```', /^#{1,6} /];
    let currentLine = prefix.split('\n').pop();
    if (!currentLine) {
      return undefined;
    }
    currentLine = currentLine.trim();
    for (const starter of singleLineStarters) {
      if (
        typeof starter === 'string'
          ? currentLine.startsWith(starter)
          : starter.test(currentLine)
      ) {
        return false;
      }
    }
    return undefined;
  },
};
