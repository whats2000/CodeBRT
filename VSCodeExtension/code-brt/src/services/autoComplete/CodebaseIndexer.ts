import * as fs from 'fs/promises';
import * as path from 'path';
import {
  Range,
  AutocompleteSnippet,
  IndexEntry,
  Symbol,
  Position,
} from './types';
import { ParserFactory } from './ParserFactory';

export class CodebaseIndexer {
  private wordIndex: Map<string, IndexEntry[]> = new Map();
  private symbols: Symbol[] = [];
  private projectRoot: string;
  private parserFactory: typeof ParserFactory;

  constructor(projectRoot: string, parserFactory: typeof ParserFactory) {
    this.projectRoot = projectRoot;
    this.parserFactory = parserFactory;
  }

  async indexCodebase(): Promise<void> {
    await this.indexDirectory(this.projectRoot);
  }

  private async indexDirectory(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.indexDirectory(fullPath);
      } else if (entry.isFile() && this.isSourceFile(entry.name)) {
        await this.indexFile(fullPath);
      }
    }
  }

  private isSourceFile(filename: string): boolean {
    // 這裡我們可以擴展支持的文件類型
    const supportedExtensions = [
      '.ts',
      '.js',
      '.tsx',
      '.jsx',
      '.py',
      '.php',
      '.rb',
      '.cs',
      '.c',
      '.cpp',
      '.java',
    ];
    return supportedExtensions.includes(path.extname(filename).toLowerCase());
  }

  private async indexFile(filepath: string): Promise<void> {
    const content = await fs.readFile(filepath, 'utf-8');
    await this.extractSymbols(content, filepath);
    this.indexWords(content, filepath);
  }

  private async extractSymbols(
    content: string,
    filepath: string,
  ): Promise<void> {
    try {
      const parser = this.parserFactory.getParser(filepath);
      const symbols = await parser.extractSymbols(content, filepath);
      this.symbols.push(...symbols);
    } catch (error) {
      console.error(`Error extracting symbols from ${filepath}:`, error);
      // 如果特定語言的解析失敗，我們可以退回到一個通用的符號提取方法
      this.extractGenericSymbols(content, filepath);
    }
  }

  private extractGenericSymbols(content: string, filepath: string): void {
    // 基本的通用符號提取，作為後備方案
    const genericSymbolRegex = /\b(\w+)\s*\([^)]*\)\s*\{/g;
    let match;
    while ((match = genericSymbolRegex.exec(content)) !== null) {
      const startPosition = this.getPositionFromIndex(content, match.index);
      const endPosition = this.getPositionFromIndex(
        content,
        match.index + match[0].length,
      );
      this.symbols.push({
        name: match[1],
        kind: 'function', // 假設為函數
        filepath,
        position: startPosition,
        range: {
          start: startPosition,
          end: endPosition,
        },
        scope: 'global', // 這是一個簡化，實際作用域可能不同
      });
    }
  }

  private indexWords(content: string, filepath: string): void {
    const words = content.split(/\W+/);
    words.forEach((word, index) => {
      if (word.length > 0) {
        const position = this.getPositionFromIndex(
          content,
          content.indexOf(word, index),
        );
        this.addToIndex(word, filepath, {
          start: position,
          end: { ...position, character: position.character + word.length },
        });
      }
    });
  }

  private addToIndex(word: string, filepath: string, range: Range): void {
    if (!this.wordIndex.has(word)) {
      this.wordIndex.set(word, []);
    }
    this.wordIndex.get(word)!.push({ filepath, range, content: word });
  }

  private getPositionFromIndex(content: string, index: number): Position {
    const lines = content.slice(0, index).split('\n');
    return {
      line: lines.length - 1,
      character: lines[lines.length - 1].length,
    };
  }

  async search(query: string): Promise<IndexEntry[]> {
    const words = query.split(/\W+/).filter((word) => word.length > 0);
    const results = words.flatMap((word) => this.wordIndex.get(word) || []);
    return this.uniqueEntries(results);
  }

  private uniqueEntries(entries: IndexEntry[]): IndexEntry[] {
    const seen = new Set<string>();
    return entries.filter((entry) => {
      const key = `${entry.filepath}:${entry.range.start.line}:${entry.range.start.character}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  getProjectSymbols(): Symbol[] {
    return this.symbols;
  }

  async getRelevantSnippets(
    prefix: string,
    suffix: string,
  ): Promise<AutocompleteSnippet[]> {
    const query = prefix.slice(-50) + suffix.slice(0, 50);
    const results = await this.search(query);

    const snippets = await Promise.all(
      results.map(async (entry) => {
        const content = await fs.readFile(entry.filepath, 'utf-8');
        const lines = content.split('\n');
        const snippetStart = Math.max(0, entry.range.start.line - 2);
        const snippetEnd = Math.min(lines.length, entry.range.end.line + 3);
        return {
          content: lines.slice(snippetStart, snippetEnd).join('\n'),
          filepath: entry.filepath,
          range: {
            start: { line: snippetStart, character: 0 },
            end: {
              line: snippetEnd,
              character: lines[snippetEnd]?.length || 0,
            },
          },
        };
      }),
    );

    return snippets;
  }
}
