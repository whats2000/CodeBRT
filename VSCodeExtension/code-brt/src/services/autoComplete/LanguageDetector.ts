// LanguageDetector.ts

import * as path from 'path';
import { AutocompleteLanguageInfo } from './types';

export class LanguageDetector {
  private languageMap: { [key: string]: AutocompleteLanguageInfo } = {
    ts: {
      name: 'TypeScript',
      extensions: ['.ts', '.tsx'],
      singleLineComment: '//',
      multiLineCommentStart: '/*',
      multiLineCommentEnd: '*/',
      stringDelimiters: ['"', "'", '`'],
      keywords: [
        'function',
        'class',
        'interface',
        'type',
        'enum',
        'const',
        'let',
        'var',
      ],
      brackets: { '(': ')', '[': ']', '{': '}' },
      indentationRules: {
        increaseIndentPattern:
          /^(.*\{[^}]*|\s*(public|private|protected)\s*$)$/,
        decreaseIndentPattern: /^\s*\}.*$/,
      },
    },
    js: {
      name: 'JavaScript',
      extensions: ['.js', '.jsx'],
      singleLineComment: '//',
      multiLineCommentStart: '/*',
      multiLineCommentEnd: '*/',
      stringDelimiters: ['"', "'", '`'],
      keywords: ['function', 'class', 'const', 'let', 'var'],
      brackets: { '(': ')', '[': ']', '{': '}' },
      indentationRules: {
        increaseIndentPattern: /^(.*\{[^}]*|\s*(function)\s*$)$/,
        decreaseIndentPattern: /^\s*\}.*$/,
      },
    },
    py: {
      name: 'Python',
      extensions: ['.py'],
      singleLineComment: '#',
      multiLineCommentStart: '"""',
      multiLineCommentEnd: '"""',
      stringDelimiters: ['"', "'"],
      keywords: [
        'def',
        'class',
        'import',
        'from',
        'if',
        'elif',
        'else',
        'for',
        'while',
      ],
      brackets: { '(': ')', '[': ']', '{': '}' },
      indentationRules: {
        increaseIndentPattern: /:\s*$/,
        decreaseIndentPattern: /^\s*(elif|else|except|finally)\b/,
      },
    },
    c: {
      name: 'C',
      extensions: ['.c', '.h'],
      singleLineComment: '//',
      multiLineCommentStart: '/*',
      multiLineCommentEnd: '*/',
      stringDelimiters: ['"', "'"],
      keywords: ['int', 'char', 'if', 'else', 'for', 'while', 'return'],
      brackets: { '(': ')', '[': ']', '{': '}' },
    },
    cpp: {
      name: 'C++',
      extensions: ['.cpp', '.hpp'],
      singleLineComment: '//',
      multiLineCommentStart: '/*',
      multiLineCommentEnd: '*/',
      stringDelimiters: ['"', "'"],
      keywords: [
        'int',
        'char',
        'if',
        'else',
        'for',
        'while',
        'return',
        'class',
      ],
      brackets: { '(': ')', '[': ']', '{': '}' },
    },
    cs: {
      name: 'C#',
      extensions: ['.cs'],
      singleLineComment: '//',
      multiLineCommentStart: '/*',
      multiLineCommentEnd: '*/',
      stringDelimiters: ['"', "'"],
      keywords: [
        'class',
        'interface',
        'void',
        'public',
        'private',
        'protected',
        'static',
      ],
      brackets: { '(': ')', '[': ']', '{': '}' },
    },
    php: {
      name: 'PHP',
      extensions: ['.php'],
      singleLineComment: '//',
      multiLineCommentStart: '/*',
      multiLineCommentEnd: '*/',
      stringDelimiters: ['"', "'"],
      keywords: ['function', 'class', 'echo', 'if', 'else', 'for', 'while'],
      brackets: { '(': ')', '[': ']', '{': '}' },
    },
    r: {
      name: 'R',
      extensions: ['.r'],
      singleLineComment: '#',
      multiLineCommentStart: '',
      multiLineCommentEnd: '',
      stringDelimiters: ['"', "'"],
      keywords: ['function', 'if', 'else', 'for', 'while', 'return'],
      brackets: { '(': ')', '[': ']', '{': '}' },
    },
    yaml: {
      name: 'YAML',
      extensions: ['.yaml', '.yml'],
      singleLineComment: '#',
      multiLineCommentStart: '',
      multiLineCommentEnd: '',
      stringDelimiters: ['"', "'"],
      keywords: [],
      brackets: {},
    },
    md: {
      name: 'Markdown',
      extensions: ['.md'],
      singleLineComment: '',
      multiLineCommentStart: '',
      multiLineCommentEnd: '',
      stringDelimiters: [],
      keywords: [],
      brackets: {},
    },
    rb: {
      name: 'Ruby',
      extensions: ['.rb'],
      singleLineComment: '#',
      multiLineCommentStart: '=begin',
      multiLineCommentEnd: '=end',
      stringDelimiters: ['"', "'"],
      keywords: ['def', 'class', 'module', 'if', 'else', 'end'],
      brackets: { '(': ')', '[': ']', '{': '}' },
    },
  };

  detectLanguage(filepath: string): AutocompleteLanguageInfo | null {
    const extension = path.extname(filepath).toLowerCase();
    for (const lang of Object.values(this.languageMap)) {
      if (lang.extensions.includes(extension)) {
        return lang;
      }
    }
    return null;
  }

  detectLanguageFromContent(content: string): AutocompleteLanguageInfo | null {
    if (content.includes('function') || content.includes('class')) {
      return this.languageMap.js; // JavaScript/TypeScript
    } else if (content.includes('def') || content.includes('import ')) {
      return this.languageMap.py; // Python
    } else if (content.includes('class ') || content.includes('public')) {
      return this.languageMap.cs; // C#
    } else if (content.includes('#include') || content.includes('int main')) {
      return this.languageMap.cpp; // C/C++
    } else if (content.includes('<?php')) {
      return this.languageMap.php; // PHP
    } else if (content.includes('library') || content.includes('function(')) {
      return this.languageMap.r; // R
    } else if (content.includes('---') || content.includes(':')) {
      return this.languageMap.yaml; // YAML
    } else if (content.includes('# ') || content.includes('```')) {
      return this.languageMap.md; // Markdown
    } else if (content.includes('def ') || content.includes('class ')) {
      return this.languageMap.rb; // Ruby
    }
    return null;
  }

  getLanguageInfo(language: string): AutocompleteLanguageInfo | null {
    return this.languageMap[language] || null;
  }

  getSupportedLanguages(): string[] {
    return Object.keys(this.languageMap);
  }
}

// languageMap 是一个包含不同语言的定义对象。每种语言有以下属性：
// name: 语言名称。
// extensions: 该语言文件的扩展名。
// singleLineComment: 单行注释符号。
// multiLineCommentStart 和 multiLineCommentEnd: 多行注释符号。
// stringDelimiters: 字符串的定界符（如 "、'、` 等）。
// keywords: 语言中的关键字。
// brackets: 配对括号（如 ()、[]、{} 等）。
// indentationRules: 缩进规则，用于自动格式化代码。

// detectLanguage(filepath: string): AutocompleteLanguageInfo | null

// 根据文件的扩展名来检测编程语言。
// 检查文件扩展名是否在 languageMap 中存在，如果存在则返回该语言的详细信息。
// detectLanguageFromContent(content: string): AutocompleteLanguageInfo | null

// 通过分析文件的内容来推断语言。
// 简单地根据文件中是否包含 function、class、def 或 import 等常见关键字来推断可能的语言。

//ts，js，python以外其他語言還未添加，可以繼續添加更多語言。
