import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import Parser, { Query } from 'web-tree-sitter';

import { getLanguageConfig } from './languageConfig';
import { FileOperationsProvider } from '../../utils';
import type { CodeContext } from './types';

export class CodeParserProvider {
  private static parserMap: Record<string, Parser> = {};
  private static queryMap: Record<string, Query> = {};

  /**
   * Initialize and return a parser and query for a specific language based on file extension.
   * @param extension - The file extension (For example, 'js', 'ts', 'py').
   */
  private static async getParserAndQueryForExtension(
    extension: string,
  ): Promise<{ parser: Parser | null; query: Parser.Query | null }> {
    const languageConfig = getLanguageConfig(extension);
    if (!languageConfig) return { parser: null, query: null };

    // Initialize parser and query if not loaded
    if (!this.parserMap[extension]) {
      await Parser.init();
      const parser = new Parser();
      const Language = await Parser.Language.load(languageConfig.grammarPath);
      parser.setLanguage(Language);
      this.parserMap[extension] = parser;

      try {
        // Use the `query` method on Language
        this.queryMap[extension] = Language.query(languageConfig.queryPattern);
      } catch (error) {
        console.error(
          `Failed to load query for extension .${extension}:`,
          error,
        );
        return { parser, query: null };
      }
    }

    return {
      parser: this.parserMap[extension],
      query: this.queryMap[extension],
    };
  }

  /**
   * Extracts a structured representation of the code, excluding private methods/properties.
   * @param tree - The syntax tree of the code.
   * @param query - The query to capture relevant syntax nodes.
   * @param code - The original code content.
   * @returns A formatted string summarizing the code structure.
   */
  private static extractCodeStructure(
    tree: Parser.Tree,
    query: Query,
    code: string,
  ): string {
    const captures = query.captures(tree.rootNode);
    const elements: string[] = [];
    const lines = code.split('\n');

    captures.sort(
      (a, b) => a.node.startPosition.row - b.node.startPosition.row,
    );

    let lastLine = -1;
    captures.forEach((capture) => {
      const { node, name } = capture;
      const startLine = node.startPosition.row;
      const endLine = node.endPosition.row;

      // Skip private definitions
      if (lines[startLine].trim().startsWith('private')) return;

      // Add separator for new definitions
      if (name.includes('definition') && startLine > lastLine + 1) {
        elements.push('|----');
      }

      // If the capture is a function or method name, extract the full signature including multi-line parameters
      if (name.includes('name')) {
        let definitionLines = '';
        let openParens = 0;
        let closedParens = 0;
        let lineIndex = startLine;

        // Continue to capture lines until parentheses are balanced
        while (lineIndex <= endLine || openParens !== closedParens) {
          const line = lines[lineIndex].trim();

          // Count parentheses
          for (const char of line) {
            if (char === '(') openParens++;
            else if (char === ')') closedParens++;
          }

          // Add line to definition and increment line index
          definitionLines += `│ ${line}\n`;
          lineIndex++;

          // If balanced parentheses are achieved and we're at the end of a definition, break out of the loop
          if (openParens === closedParens && openParens > 0) break;
        }

        elements.push(definitionLines.trim());
      }

      lastLine = endLine;
    });

    return elements.length ? `|----\n${elements.join('\n')}\n|----` : '';
  }

  /**
   * Generate a structured context summary of code in a directory.
   * @param directoryPath - The directory containing code files.
   * @returns An array of CodeContext objects summarizing code structure.
   */
  public static async generateCodeContext(
    directoryPath: string,
  ): Promise<CodeContext[]> {
    const codeContexts: CodeContext[] = [];
    const { absoluteFilesList } = await FileOperationsProvider.listFiles(
      directoryPath,
      true,
      200,
    );

    for (const file of absoluteFilesList) {
      const extension = path.extname(file).slice(1);
      if (extension === '') continue;
      const { parser, query } =
        await this.getParserAndQueryForExtension(extension);
      if (!parser || !query) {
        console.warn(`No parser or query found for extension .${extension}`);
        continue;
      }

      const code = await fs.readFile(file, 'utf-8');
      const tree = parser.parse(code);

      if (tree) {
        const structure = this.extractCodeStructure(tree, query, code);
        codeContexts.push({
          fileName: path.relative(directoryPath, file),
          structure,
        });
      }
    }
    return codeContexts;
  }
}
