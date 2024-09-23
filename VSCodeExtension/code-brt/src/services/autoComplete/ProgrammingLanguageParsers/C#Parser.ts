import Parser from 'tree-sitter';
import CSharp from 'tree-sitter-c-sharp';
import { ISymbolExtractor, Position, Symbol } from '../types';

export class CSharpParser implements ISymbolExtractor {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(CSharp);
  }

  async extractSymbols(code: string, filepath: string): Promise<Symbol[]> {
    const tree = this.parser.parse(code);
    const symbols: Symbol[] = [];

    function traverse(node: Parser.SyntaxNode, currentScope: string) {
      if (node.type === 'method_declaration') {
        symbols.push(createSymbol(node, 'method', currentScope, filepath));
      } else if (node.type === 'class_declaration') {
        symbols.push(createSymbol(node, 'class', currentScope, filepath));
        currentScope = `${currentScope}.${node.childForFieldName('name')?.text || ''}`;
      } else if (node.type === 'using_directive') {
        symbols.push(createSymbol(node, 'using', currentScope, filepath));
      }

      for (const child of node.children) {
        traverse(child, currentScope);
      }
    }

    traverse(tree.rootNode, 'global');
    return symbols;
  }

  async extractNearbySymbols(
    code: string,
    position: Position,
    filepath: string,
  ): Promise<Symbol[]> {
    const symbols = await this.extractSymbols(code, filepath);
    return symbols.filter(
      (symbol) => Math.abs(symbol.position.line - position.line) <= 5,
    );
  }

  async getSymbolAtPosition(
    code: string,
    position: Position,
    filepath: string,
  ): Promise<Symbol | null> {
    const symbols = await this.extractSymbols(code, filepath);
    return (
      symbols.find(
        (symbol) =>
          symbol.position.line === position.line &&
          symbol.position.character <= position.character &&
          symbol.range.end.character >= position.character,
      ) || null
    );
  }
}

function createSymbol(
  node: Parser.SyntaxNode,
  kind: string,
  scope: string,
  filepath: string,
): Symbol {
  return {
    name: node.childForFieldName('name')?.text || '',
    kind,
    position: {
      line: node.startPosition.row,
      character: node.startPosition.column,
    },
    scope,
    filepath,
    range: {
      start: {
        line: node.startPosition.row,
        character: node.startPosition.column,
      },
      end: {
        line: node.endPosition.row,
        character: node.endPosition.column,
      },
    },
  };
}
