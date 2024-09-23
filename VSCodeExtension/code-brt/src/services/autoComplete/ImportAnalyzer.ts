//ImportAnalyzer.ts
import * as path from 'path';
import * as fs from 'fs';
import { ImportInfo, Symbol } from './types';
import { LanguageDetector } from './LanguageDetector';
import { ParserFactory } from './ParserFactory';

export class ImportAnalyzer {
  private languageDetector: LanguageDetector;
  private parserFactory: typeof ParserFactory;

  constructor(languageDetector: LanguageDetector) {
    this.languageDetector = languageDetector;
    this.parserFactory = ParserFactory;
  }

  async analyzeFile(filePath: string): Promise<ImportInfo[]> {
    try {
      const language = this.languageDetector.detectLanguage(filePath);
      if (!language) {
        throw new Error(`Unsupported file type: ${filePath}`);
      }

      const parser = this.parserFactory.getParser(filePath);
      const symbols = await parser.extractSymbols(
        fs.readFileSync(filePath, 'utf8'),
        filePath,
      );

      return this.convertSymbolsToImports(symbols, language.name);
    } catch (error) {
      throw new Error(
        `Error analyzing imports in ${filePath}: ${(error as Error).message}`,
      );
    }
  }

  private convertSymbolsToImports(
    symbols: Symbol[],
    language: string,
  ): ImportInfo[] {
    return symbols
      .filter((symbol) => this.isImportSymbol(symbol, language))
      .map((symbol) => this.symbolToImportInfo(symbol, language));
  }

  private isImportSymbol(symbol: Symbol, language: string): boolean {
    switch (language.toLowerCase()) {
      case 'typescript':
      case 'javascript':
        return symbol.kind === 'import';
      case 'python':
        return symbol.kind === 'import' || symbol.kind === 'from';
      case 'c':
      case 'c++':
        return symbol.kind === 'include';
      case 'c#':
        return symbol.kind === 'using';
      case 'php':
        return (
          symbol.kind === 'use' ||
          symbol.kind === 'include' ||
          symbol.kind === 'require'
        );
      case 'r':
        return symbol.kind === 'library' || symbol.kind === 'source';
      case 'ruby':
        return symbol.kind === 'require' || symbol.kind === 'require_relative';
      case 'yaml':
        return symbol.kind === 'import' || symbol.kind === 'include';
      default:
        return false;
    }
  }

  private symbolToImportInfo(symbol: Symbol, language: string): ImportInfo {
    return {
      name: symbol.name,
      kind: this.mapSymbolKind(symbol.kind),
      sourcePath: this.getSourcePath(symbol, language),
      range: symbol.range,
    };
  }

  private mapSymbolKind(kind: string): 'default' | 'named' | 'namespace' {
    switch (kind) {
      case 'default':
      case 'named':
      case 'namespace':
        return kind;
      default:
        throw new Error(`Unsupported symbol kind: ${kind}`);
    }
  }

  private getSourcePath(symbol: Symbol, language: string): string {
    switch (language.toLowerCase()) {
      case 'typescript':
      case 'javascript':
      case 'python':
      case 'php':
      case 'ruby':
      case 'yaml':
        return symbol.scope || '';
      case 'c':
      case 'c++':
        return symbol.name; // For #include, the name is the path
      case 'c#':
      case 'r':
        return symbol.name; // For using and library/source, the name is the path
      default:
        return '';
    }
  }

  async resolveImportPath(
    basePath: string,
    importPath: string,
  ): Promise<string | null> {
    const extensions = [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.py',
      '.c',
      '.cpp',
      '.cs',
      '.php',
      '.r',
      '.rb',
      '.yml',
      '.yaml',
    ];
    let resolvedPath = path.resolve(path.dirname(basePath), importPath);

    if (
      fs.existsSync(resolvedPath) &&
      fs.statSync(resolvedPath).isDirectory()
    ) {
      for (const ext of extensions) {
        const indexPath = path.join(resolvedPath, `index${ext}`);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    }

    for (const ext of extensions) {
      const fullPath = `${resolvedPath}${ext}`;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    return null;
  }
}
