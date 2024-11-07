import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import Parser from 'web-tree-sitter';
import { getLanguageConfig } from './languageConfig';
import { FileOperationsProvider } from '../../utils';
import type { CodeContext } from './types';

export class CodeParserProvider {
  private static parserMap: Record<string, Parser> = {};

  /**
   * Initialize and return a parser for a specific language based on file extension.
   * @param extension - The file extension (e.g., 'js', 'ts', 'py').
   */
  private static async getParserForExtension(
    extension: string,
  ): Promise<Parser | null> {
    const languageConfig = getLanguageConfig(extension);
    if (!languageConfig) return null;

    // Check if the parser for this language is already initialized
    if (!this.parserMap[extension]) {
      await Parser.init();
      const parser = new Parser();
      const Language = await Parser.Language.load(languageConfig.grammarPath);
      parser.setLanguage(Language);
      this.parserMap[extension] = parser;
    }

    return this.parserMap[extension];
  }

  /**
   * Extracts a concise representation of the code structure (e.g., functions, classes).
   * @param tree - The syntax tree of the code.
   * @returns A string summarizing the code structure.
   */
  private static extractCodeStructure(tree: Parser.Tree): string {
    const elements: string[] = [];
    const cursor = tree.rootNode.walk();

    do {
      const nodeType = cursor.nodeType;
      if (nodeType === 'function' || nodeType === 'class') {
        const nameNode = cursor.currentNode?.namedChild(0);
        const name = nameNode ? nameNode.text : 'anonymous';
        elements.push(`${nodeType}: ${name}`);
      }
    } while (cursor.gotoNextSibling());

    return elements.join('\n');
  }

  /**
   * Generate a concise context summary of code in a directory.
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
      const parser = await this.getParserForExtension(extension);
      if (!parser) {
        console.warn(`No parser found for extension .${extension}`);
        continue;
      }

      const code = await fs.readFile(file, 'utf-8');
      const tree = parser.parse(code);

      if (tree) {
        const structure = this.extractCodeStructure(tree);
        codeContexts.push({
          fileName: path.relative(directoryPath, file),
          structure,
        });
      }
    }
    return codeContexts;
  }
}
