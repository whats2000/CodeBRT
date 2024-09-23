//CodeAnalyzer.ts

import { Position, AstNode, Symbol } from './types';
import { LanguageDetector } from './LanguageDetector';
import { ParserFactory } from './ParserFactory';

export class CodeAnalyzer {
  private astCache: Map<string, AstNode>;
  private languageDetector: LanguageDetector;

  constructor(languageDetector: LanguageDetector) {
    this.astCache = new Map();
    this.languageDetector = languageDetector;
  }

  async getAst(fileContents: string, filepath: string): Promise<AstNode> {
    const cacheKey = `${filepath}:${fileContents.length}`;
    if (this.astCache.has(cacheKey)) {
      return this.astCache.get(cacheKey)!;
    }

    const languageInfo = this.languageDetector.detectLanguage(filepath);
    if (!languageInfo) {
      throw new Error(`Unable to detect language for file: ${filepath}`);
    }

    const parser = ParserFactory.getParser(filepath);
    const symbols = await parser.extractSymbols(fileContents, filepath);
    const ast = this.convertSymbolsToAst(symbols);

    this.astCache.set(cacheKey, ast);
    return ast;
  }

  private convertSymbolsToAst(symbols: Symbol[]): AstNode {
    const root: AstNode = {
      type: 'root',
      startPosition: { line: 0, character: 0 },
      endPosition: {
        line: Number.MAX_SAFE_INTEGER,
        character: Number.MAX_SAFE_INTEGER,
      },
      children: [],
      text: '',
    };

    for (const symbol of symbols) {
      const node: AstNode = {
        type: symbol.kind,
        startPosition: symbol.position,
        endPosition: symbol.range.end,
        text: symbol.name,
        children: [],
      };
      root.children = root.children || [];
      root.children.push(node);
    }

    return root;
  }

  async getInfoAtCursor(
    fileContents: string,
    filepath: string,
    cursorPosition: Position,
  ): Promise<AstNode | null> {
    const ast = await this.getAst(fileContents, filepath);
    const node = this.findNodeAtPosition(ast, cursorPosition);
    return node ? this.getNodeInfo(node) : null;
  }

  private findNodeAtPosition(
    node: AstNode,
    position: Position,
  ): AstNode | null {
    if (!this.isPositionInNode(position, node)) {
      return null;
    }

    for (const child of node.children || []) {
      const foundNode = this.findNodeAtPosition(child, position);
      if (foundNode) {
        return foundNode;
      }
    }

    return node;
  }

  private isPositionInNode(position: Position, node: AstNode): boolean {
    return (
      (position.line > node.startPosition.line ||
        (position.line === node.startPosition.line &&
          position.character >= node.startPosition.character)) &&
      (position.line < node.endPosition.line ||
        (position.line === node.endPosition.line &&
          position.character <= node.endPosition.character))
    );
  }

  private getNodeInfo(node: AstNode): AstNode {
    return {
      type: node.type,
      startPosition: node.startPosition,
      endPosition: node.endPosition,
      text: node.text,
      children: [],
    };
  }

  async getEnclosingFunction(
    fileContents: string,
    filepath: string,
    position: Position,
  ): Promise<AstNode | null> {
    const ast = await this.getAst(fileContents, filepath);
    const node = this.findNodeAtPosition(ast, position);
    if (!node) return null;

    let current: AstNode | undefined = node;
    while (current) {
      if (
        current.type === 'function_declaration' ||
        current.type === 'arrow_function' ||
        current.type === 'method_definition'
      ) {
        return current;
      }
      current = current.parent;
    }

    return null;
  }

  async getVariablesInScope(
    fileContents: string,
    filepath: string,
    position: Position,
  ): Promise<string[]> {
    await this.getAst(fileContents, filepath);
    const enclosingFunction = await this.getEnclosingFunction(
      fileContents,
      filepath,
      position,
    );
    if (!enclosingFunction) return [];

    const variables: string[] = [];
    this.collectVariables(enclosingFunction, variables);
    return variables;
  }

  private collectVariables(node: AstNode, variables: string[]): void {
    if (node.type === 'variable_declarator') {
      if (node.text) {
        variables.push(node.text);
      }
    }

    for (const child of node.children || []) {
      this.collectVariables(child, variables);
    }
  }

  clearCache(): void {
    this.astCache.clear();
  }
}
