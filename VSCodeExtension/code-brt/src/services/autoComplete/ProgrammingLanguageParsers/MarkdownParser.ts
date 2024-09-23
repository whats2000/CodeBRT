import { ISymbolExtractor, Position, Symbol } from '../types';
import { lexer } from 'marked';

export class MarkdownParser implements ISymbolExtractor {
  async extractSymbols(code: string, filepath: string): Promise<Symbol[]> {
    const tokens = lexer(code);
    const symbols: Symbol[] = [];

    tokens.forEach((token: any) => {
      if (token.type === 'heading') {
        symbols.push({
          name: token.text,
          kind: 'heading',
          position: {
            line: token.startPosition.row,
            character: token.startPosition.column,
          },
          scope: 'global',
          filepath,
          range: {
            start: {
              line: token.startPosition.row,
              character: token.startPosition.column,
            },
            end: {
              line: token.endPosition.row,
              character: token.endPosition.column,
            },
          },
        });
      }
    });

    return symbols;
  }

  async extractNearbySymbols(
    code: string,
    position: Position,
    filepath: string,
  ): Promise<Symbol[]> {
    const symbols = await this.extractSymbols(code, filepath);
    return symbols.filter((symbol) => symbol.position.line === position.line);
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
