import Parser from 'tree-sitter';
import CPP from 'tree-sitter-cpp';
import { ISymbolExtractor, Position, Symbol } from '../types';

export class CppParser implements ISymbolExtractor {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(CPP);
  }

  async extractSymbols(code: string, filepath: string): Promise<Symbol[]> {
    const tree = this.parser.parse(code);
    const symbols: Symbol[] = [];

    function traverse(node: Parser.SyntaxNode, currentScope: string) {
      if (node.type === 'function_definition') {
        symbols.push(createSymbol(node, 'function', currentScope, filepath));
      } else if (node.type === 'class_specifier') {
        symbols.push(createSymbol(node, 'class', currentScope, filepath));
        currentScope = `${currentScope}.${node.childForFieldName('name')?.text || ''}`;
      } else if (node.type === 'declaration') {
        symbols.push(createSymbol(node, 'variable', currentScope, filepath));
      } else if (node.type === 'preproc_include') {
        symbols.push(createSymbol(node, 'include', currentScope, filepath));
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
      (symbol) =>
        symbol.position.line <= position.line &&
        symbol.range.end.line >= position.line,
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
    name:
      node.childForFieldName('declarator')?.text ||
      node.childForFieldName('name')?.text ||
      node.text,
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
