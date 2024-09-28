import { ManuallyCompleteLanguageInfo } from '../../../types';

export const Typescript = {
  topLevelKeywords: ['function', 'class', 'module', 'export', 'import'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// Python
export const Python = {
  // """"#" is for .ipynb files, where we add '"""' surrounding markdown blocks.
  // This stops the model from trying to complete the start of a new markdown block
  topLevelKeywords: ['def', 'class', '"""#'],
  singleLineComment: '#',
  endOfLine: [],
};

// Java
export const Java = {
  topLevelKeywords: ['class', 'function'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// C++
export const Cpp = {
  topLevelKeywords: ['class', 'namespace', 'template'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// C#
export const CSharp = {
  topLevelKeywords: ['class', 'namespace', 'void'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// C
export const C = {
  topLevelKeywords: ['if', 'else', 'while', 'for', 'switch', 'case'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// PHP
export const PHP = {
  topLevelKeywords: ['function', 'class', 'namespace', 'use'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// Ruby on Rails
export const RubyOnRails = {
  topLevelKeywords: ['def', 'class', 'module'],
  singleLineComment: '#',
  endOfLine: [],
};

// Ruby
export const Ruby = {
  topLevelKeywords: ['class', 'module', 'def'],
  singleLineComment: '#',
  endOfLine: [],
};

// Clojure
export const Clojure = {
  topLevelKeywords: ['def', 'fn', 'let', 'do', 'if', 'defn', 'ns', 'defmacro'],
  singleLineComment: ';',
  endOfLine: [],
};

// R
export const R = {
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

export const FILE_TO_LANGUAGE_CONTEXT: {
  [extension: string]: ManuallyCompleteLanguageInfo;
} = {
  ts: Typescript,
  js: Typescript,
  tsx: Typescript,
  jsx: Typescript,
  ipynb: Python,
  py: Python,
  pyi: Python,
  java: Java,
  cpp: Cpp,
  cxx: Cpp,
  h: Cpp,
  hpp: Cpp,
  cs: CSharp,
  c: C,
  php: PHP,
  rb: Ruby,
  rails: RubyOnRails,
  clj: Clojure,
  cljs: Clojure,
  cljc: Clojure,
  r: R,
  R: R,
  yaml: YAML,
  yml: YAML,
  md: Markdown,
};

FILE_TO_LANGUAGE_CONTEXT.ts.builtInFunctions = [
  'console.log',
  'parseInt',
  'setTimeout',
  'Promise',
];

FILE_TO_LANGUAGE_CONTEXT.ts.commonLibraries = [
  'react',
  'angular',
  'vue',
  'express',
];

FILE_TO_LANGUAGE_CONTEXT.py.builtInFunctions = [
  'print',
  'len',
  'range',
  'input',
];

FILE_TO_LANGUAGE_CONTEXT.py.commonLibraries = [
  'numpy',
  'pandas',
  'matplotlib',
  'sklearn',
];

export const FILE_MAPPING: { [key: string]: string } = {
  typescript: 'ts',
  javascript: 'js',
  typescriptreact: 'tsx',
  javascriptreact: 'jsx',
  python: 'py',
  jupyter: 'ipynb',
  java: 'java',
  cpp: 'cpp',
  csharp: 'cs',
  c: 'c',
  php: 'php',
  ruby: 'rb',
  clojure: 'clj',
  r: 'r',
  yaml: 'yaml',
  markdown: 'md',
};

export const LANGUAGE_NAME_MAPPING: { [key: string]: string } = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  jsx: 'JavaScript',
  python: 'Python',
  jupyter: 'Jupyter Notebook',
  java: 'Java',
  cpp: 'C++',
  csharp: 'C#',
  c: 'C',
  php: 'PHP',
  ruby: 'Ruby',
  clojure: 'Clojure',
  r: 'R',
  yaml: 'YAML',
  markdown: 'Markdown',
};
