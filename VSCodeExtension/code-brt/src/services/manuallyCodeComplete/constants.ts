// TypeScript
import { ManuallyCompleteLanguageInfo } from '../../types';

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

export const Constants: { [extension: string]: ManuallyCompleteLanguageInfo } =
  {
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

Constants.ts.builtInFunctions = [
  'console.log',
  'parseInt',
  'setTimeout',
  'Promise',
];
Constants.ts.commonLibraries = ['react', 'angular', 'vue', 'express'];

Constants.py.builtInFunctions = ['print', 'len', 'range', 'input'];
Constants.py.commonLibraries = ['numpy', 'pandas', 'matplotlib', 'sklearn'];

export const supportedLanguages = Object.keys(Constants)
  .map((ext) => {
    switch (ext) {
      case 'ts':
      case 'js':
      case 'tsx':
      case 'jsx':
        return { scheme: 'file', language: 'typescript' };
      case 'py':
      case 'pyi':
        return { scheme: 'file', language: 'python' };
      case 'ipynb':
        return { scheme: 'file', language: 'jupyter' };
      case 'java':
        return { scheme: 'file', language: 'java' };
      case 'cpp':
      case 'cxx':
      case 'h':
      case 'hpp':
        return { scheme: 'file', language: 'cpp' };
      case 'cs':
        return { scheme: 'file', language: 'csharp' };
      case 'c':
        return { scheme: 'file', language: 'c' };
      case 'php':
        return { scheme: 'file', language: 'php' };
      case 'rb':
        return { scheme: 'file', language: 'ruby' };
      case 'clj':
      case 'cljs':
      case 'cljc':
        return { scheme: 'file', language: 'clojure' };
      case 'r':
      case 'R':
        return { scheme: 'file', language: 'r' };
      case 'yaml':
      case 'yml':
        return { scheme: 'file', language: 'yaml' };
      case 'md':
        return { scheme: 'file', language: 'markdown' };
      default:
        return null;
    }
  })
  .filter((lang) => lang !== null) as { scheme: string; language: string }[];
