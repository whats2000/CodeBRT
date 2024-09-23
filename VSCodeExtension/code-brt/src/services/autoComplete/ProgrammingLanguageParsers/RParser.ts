import * as acorn from 'acorn';
import { ISymbolExtractor, Position, Symbol } from '../types';

export class RParser implements ISymbolExtractor {
  private parser: typeof acorn;

  constructor() {
    this.parser = acorn;
  }

  async extractSymbols(code: string, filepath: string): Promise<Symbol[]> {
    const ast = this.parser.parse(code, {
      ecmaVersion: 2020,
      sourceType: 'module',
    });
    const symbols: Symbol[] = [];

    function traverse(node: any, currentScope: string) {
      if (node.type === 'FunctionDeclaration') {
        symbols.push({
          name: node.id.name,
          kind: 'function',
          position: {
            line: node.loc.start.line,
            character: node.loc.start.column,
          },
          scope: currentScope,
          filepath,
          range: {
            start: {
              line: node.loc.start.line,
              character: node.loc.start.column,
            },
            end: {
              line: node.loc.end.line,
              character: node.loc.end.column,
            },
          },
        });
      }

      if (node.type === 'VariableDeclaration') {
        node.declarations.forEach((decl: any) => {
          symbols.push({
            name: decl.id.name,
            kind: 'variable',
            position: {
              line: decl.loc.start.line,
              character: decl.loc.start.column,
            },
            scope: currentScope,
            filepath,
            range: {
              start: {
                line: decl.loc.start.line,
                character: decl.loc.start.column,
              },
              end: {
                line: decl.loc.end.line,
                character: decl.loc.end.column,
              },
            },
          });
        });
      }

      if (
        node.type === 'CallExpression' &&
        (node.callee.name === 'library' || node.callee.name === 'require')
      ) {
        symbols.push({
          name: node.arguments[0].value,
          kind: node.callee.name, // 'library' or 'require'
          position: {
            line: node.loc.start.line,
            character: node.loc.start.column,
          },
          scope: currentScope,
          filepath,
          range: {
            start: {
              line: node.loc.start.line,
              character: node.loc.start.column,
            },
            end: {
              line: node.loc.end.line,
              character: node.loc.end.column,
            },
          },
        });
      }

      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          traverse(node[key], currentScope);
        }
      }
    }

    traverse(ast, 'global');
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
