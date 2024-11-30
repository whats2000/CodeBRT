import { ChatModelCompleteLanguageInfo } from '../types';

// C
export const C: ChatModelCompleteLanguageInfo = {
  topLevelKeywords: ['if', 'else', 'while', 'for', 'switch', 'case'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// C++
export const Cpp: ChatModelCompleteLanguageInfo = {
  topLevelKeywords: ['class', 'namespace', 'template', 'inline', 'virtual'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// C#
export const CSharp: ChatModelCompleteLanguageInfo = {
  topLevelKeywords: ['class', 'namespace', 'void', 'interface', 'enum'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// Clojure
export const Clojure: ChatModelCompleteLanguageInfo = {
  topLevelKeywords: ['def', 'fn', 'let', 'do', 'if', 'defn', 'ns', 'defmacro'],
  singleLineComment: ';',
  endOfLine: [],
};

// Go
export const Go: ChatModelCompleteLanguageInfo = {
  topLevelKeywords: ['func', 'type', 'package', 'import', 'interface', 'struct'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// Java
export const Java: ChatModelCompleteLanguageInfo = {
  topLevelKeywords: ['class', 'public', 'private', 'protected', 'interface', 'enum', 'import'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// TypeScript, JavaScript, TypeScriptReact, JavaScriptReact
export const Typescript: ChatModelCompleteLanguageInfo = {
  topLevelKeywords: ['function', 'class', 'module', 'export', 'import', 'interface', 'type'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// Kotlin
export const Kotlin: ChatModelCompleteLanguageInfo = {
  topLevelKeywords: ['fun', 'class', 'interface', 'object', 'import', 'package'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// PHP
export const PHP: ChatModelCompleteLanguageInfo = {
  topLevelKeywords: ['function', 'class', 'namespace', 'use', 'interface', 'trait'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// Python
export const Python: ChatModelCompleteLanguageInfo = {
  // """""#" is for .ipynb files, where we add '"""' surrounding markdown blocks.
  // This stops the model from trying to complete the start of a new markdown block
  topLevelKeywords: ['def', 'class', 'import', 'from', '"""#'],
  singleLineComment: '#',
  endOfLine: [],
};

// Ruby
export const Ruby: ChatModelCompleteLanguageInfo = {
  topLevelKeywords: ['class', 'module', 'def', 'require', 'include', 'extend'],
  singleLineComment: '#',
  endOfLine: [],
};

// Rust
export const Rust: ChatModelCompleteLanguageInfo = {
  topLevelKeywords: ['fn', 'struct', 'impl', 'mod', 'use', 'trait', 'enum'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// Swift
export const Swift: ChatModelCompleteLanguageInfo = {
  topLevelKeywords: ['func', 'class', 'struct', 'enum', 'protocol', 'import'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// R
export const R: ChatModelCompleteLanguageInfo = {
  topLevelKeywords: [
    'function',
    'if',
    'else',
    'for',
    'while',
    'repeat',
    'library',
    'require',
    'source',
  ],
  singleLineComment: '#',
  endOfLine: [],
};

// Vue
export const Vue: ChatModelCompleteLanguageInfo = {
  topLevelKeywords: ['export', 'import', 'component', 'method', 'computed', 'data'],
  singleLineComment: '//',
  endOfLine: [';'],
};

// YAML
export const YAML: ChatModelCompleteLanguageInfo = {
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
export const Markdown: ChatModelCompleteLanguageInfo = {
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
