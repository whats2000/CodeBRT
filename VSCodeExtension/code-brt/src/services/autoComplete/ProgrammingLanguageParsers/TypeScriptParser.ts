import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
import { ISymbolExtractor, Position, Symbol } from '../types';

export class TypeScriptParser implements ISymbolExtractor {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(TypeScript.typescript);
  }

  async extractSymbols(code: string, filepath: string): Promise<Symbol[]> {
    const tree = this.parser.parse(code);
    const symbols: Symbol[] = [];

    function traverse(node: Parser.SyntaxNode, currentScope: string) {
      if (
        node.type === 'function_declaration' ||
        node.type === 'method_definition'
      ) {
        symbols.push(createSymbol(node, 'function', currentScope, filepath));
      } else if (node.type === 'class_declaration') {
        symbols.push(createSymbol(node, 'class', currentScope, filepath));
        currentScope = `${currentScope}.${node.childForFieldName('name')?.text || ''}`;
      } else if (node.type === 'variable_declaration') {
        node.children
          .filter((child) => child.type === 'variable_declarator')
          .forEach((declarator) => {
            symbols.push(
              createSymbol(declarator, 'variable', currentScope, filepath),
            );
          });
      } else if (node.type === 'import_statement') {
        symbols.push(createSymbol(node, 'import', currentScope, filepath));
      } else if (node.type === 'interface_declaration') {
        symbols.push(createSymbol(node, 'interface', currentScope, filepath));
      } else if (node.type === 'type_alias_declaration') {
        symbols.push(createSymbol(node, 'type', currentScope, filepath));
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
    name:
      node.childForFieldName('name')?.text ||
      node.childForFieldName('declarator')?.text ||
      '',
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
