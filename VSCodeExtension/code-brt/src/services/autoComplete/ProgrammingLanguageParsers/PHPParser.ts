import * as phpParser from 'php-parser';
import { ISymbolExtractor, Position, Symbol } from '../types';

export class PHPParser implements ISymbolExtractor {
  private parser: phpParser.Engine;

  constructor() {
    this.parser = new phpParser.Engine({
      parser: {
        extractDoc: true,
        php7: true,
      },
      ast: {
        withPositions: true,
      },
    });
  }

  async extractSymbols(code: string, filepath: string): Promise<Symbol[]> {
    try {
      const ast = this.parser.parseCode(code, filepath);
      const symbols: Symbol[] = [];

      function traverse(node: any, currentScope: string) {
        if (node.kind === 'variable') {
          symbols.push(createSymbol(node, 'variable', currentScope, filepath));
        } else if (node.kind === 'function') {
          symbols.push(createSymbol(node, 'function', currentScope, filepath));
        } else if (node.kind === 'class') {
          symbols.push(createSymbol(node, 'class', currentScope, filepath));
          currentScope = `${currentScope}.${node.name}`;
        } else if (node.kind === 'method') {
          symbols.push(createSymbol(node, 'method', currentScope, filepath));
        } else if (node.kind === 'constant') {
          symbols.push(createSymbol(node, 'constant', currentScope, filepath));
        } else if (node.kind === 'usegroup') {
          node.items.forEach((item: any) => {
            symbols.push(createSymbol(item, 'import', currentScope, filepath));
          });
        } else if (node.kind === 'include' || node.kind === 'require') {
          symbols.push(createSymbol(node, 'include', currentScope, filepath));
        }

        if (node.children) {
          node.children.forEach((child: any) => traverse(child, currentScope));
        }
      }

      traverse(ast, 'global');
      return symbols;
    } catch (error) {
      console.error(`Error parsing PHP file ${filepath}:`, error);
      return [];
    }
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

function createSymbol(
  node: any,
  kind: string,
  scope: string,
  filepath: string,
): Symbol {
  return {
    name: node.name || (node.what && node.what.name) || '',
    kind,
    position: {
      line: node.loc.start.line - 1,
      character: node.loc.start.column,
    },
    scope,
    filepath,
    range: {
      start: {
        line: node.loc.start.line - 1,
        character: node.loc.start.column,
      },
      end: {
        line: node.loc.end.line - 1,
        character: node.loc.end.column,
      },
    },
  };
}
