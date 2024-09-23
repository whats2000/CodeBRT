import { ISymbolExtractor, Position, Symbol } from '../types';
import yaml from 'js-yaml';

export class YAMLParser implements ISymbolExtractor {
  async extractSymbols(code: string, filepath: string): Promise<Symbol[]> {
    const doc = yaml.load(code);
    const symbols: Symbol[] = [];

    function traverse(obj: any, path: string[], lineNumber: number) {
      if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach((key) => {
          const symbol: Symbol = {
            name: key,
            kind: 'variable',
            position: {
              line: lineNumber,
              character: 0,
            },
            scope: 'global',
            filepath,
            range: {
              start: {
                line: lineNumber,
                character: 0,
              },
              end: {
                line: lineNumber,
                character: key.length,
              },
            },
          };

          if (key === 'import' || key === 'include') {
            symbol.kind = key;
          }

          symbols.push(symbol);
          traverse(obj[key], [...path, key], lineNumber + 1);
        });
      }
    }

    traverse(doc, [], 0);
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
