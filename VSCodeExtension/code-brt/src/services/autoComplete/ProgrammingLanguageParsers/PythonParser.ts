import Parser from 'tree-sitter';
import Python from 'tree-sitter-python';
import { ISymbolExtractor, Position, Symbol } from '../types';

export class PythonParser implements ISymbolExtractor {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(Python);
  }

  async extractSymbols(code: string, filepath: string): Promise<Symbol[]> {
    const tree = this.parser.parse(code);
    const symbols: Symbol[] = [];

    function traverse(node: Parser.SyntaxNode, currentScope: string) {
      if (node.type === 'function_definition') {
        symbols.push({
          name: node.childForFieldName('name')?.text || '',
          kind: 'function',
          position: {
            line: node.startPosition.row,
            character: node.startPosition.column,
          },
          scope: currentScope,
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
        });
      }

      if (node.type === 'class_definition') {
        symbols.push({
          name: node.childForFieldName('name')?.text || '',
          kind: 'class',
          position: {
            line: node.startPosition.row,
            character: node.startPosition.column,
          },
          scope: currentScope,
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
        });
      }

      if (node.type === 'import_statement') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          symbols.push({
            name: nameNode.text,
            kind: 'import',
            position: {
              line: node.startPosition.row,
              character: node.startPosition.column,
            },
            scope: currentScope,
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
          });
        }
      }

      if (node.type === 'import_from_statement') {
        const moduleNode = node.childForFieldName('module');
        if (moduleNode) {
          symbols.push({
            name: moduleNode.text,
            kind: 'import_from',
            position: {
              line: node.startPosition.row,
              character: node.startPosition.column,
            },
            scope: currentScope,
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
          });
        }
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
          symbol.position.character === position.character,
      ) || null
    );
  }
}
