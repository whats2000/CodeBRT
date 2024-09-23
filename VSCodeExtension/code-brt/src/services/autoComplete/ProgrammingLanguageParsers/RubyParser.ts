import Parser from 'tree-sitter';
import Ruby from 'tree-sitter-ruby';
import { ISymbolExtractor, Position, Symbol } from '../types';

export class RubyParser implements ISymbolExtractor {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(Ruby);
  }

  async extractSymbols(code: string, filepath: string): Promise<Symbol[]> {
    const tree = this.parser.parse(code);
    const symbols: Symbol[] = [];

    function traverse(node: Parser.SyntaxNode, currentScope: string) {
      if (node.type === 'method') {
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

      if (node.type === 'class') {
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

      if (
        node.type === 'call' &&
        (node.childForFieldName('method')?.text === 'require' ||
          node.childForFieldName('method')?.text === 'require_relative')
      ) {
        const argument = node.childForFieldName('argument');
        if (argument && argument.type === 'string') {
          symbols.push({
            name: argument.text.slice(1, -1), // Remove quotes
            kind: node.childForFieldName('method')?.text || 'require',
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
          symbol.position.character <= position.character &&
          symbol.range.end.character >= position.character,
      ) || null
    );
  }
}
