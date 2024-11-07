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
   * Generate a structured context summary of code in a directory.
   * @param directoryPath - The directory containing code files.
   * @returns An array of CodeContext objects summarizing code structure.
   */
  public static async generateCodeContext(
    directoryPath: string,
  ): Promise<CodeContext[]> {
    const codeContexts: CodeContext[] = [];
    const { filesList } = await FileOperationsProvider.listFiles(
      directoryPath,
      true,
      200,
    );

    for (const file of filesList) {
      const extension = path.extname(file).slice(1);
      const { parser, query } =
        await this.getParserAndQueryForExtension(extension);
      if (!parser || !query) {
        console.warn(`No parser or query found for extension .${extension}`);
        continue;
      }

      const code = await fs.readFile(file, 'utf-8');
      const tree = parser.parse(code);

      if (tree) {
        const structure = this.extractCodeStructure(tree, query);
        codeContexts.push({
          fileName: path.relative(directoryPath, file),
          structure,
        });
      }
    }
    return codeContexts;
  }

  /**
   * Extracts a structured representation of the code using the query.
   * @param tree - The syntax tree of the code.
   * @param query - The query to capture relevant syntax nodes.
   * @returns A formatted string summarizing the code structure.
   */
  private static extractCodeStructure(tree: Parser.Tree, query: Query): string {
    const captures = query.captures(tree.rootNode);
    const elements: string[] = [];

    // Sort captures by start position for sequential output
    captures.sort(
      (a, b) => a.node.startPosition.row - b.node.startPosition.row,
    );

    // Track last processed line to add separators where needed
    let lastLine = -1;
    captures.forEach((capture) => {
      const { node, name } = capture;
      const startLine = node.startPosition.row;

      // Only include relevant definitions
      if (name.includes('definition') && startLine > lastLine + 1) {
        elements.push('|----');
      }

      if (name.includes('name') || name.includes('definition')) {
        const elementType = name.split('.')[1];
        const definitionText = `${elementType}: ${node.text.trim()}`;
        elements.push(`│ ${definitionText}`);
      }

      lastLine = startLine;
    });

    return elements.length ? `|----\n${elements.join('\n')}\n|----` : '';
  }
}
