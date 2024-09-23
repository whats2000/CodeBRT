// types.ts

/**
 * Represents a position in a text document.
 *
 * @interface Position
 * @property {number} line - The 0-based line number.
 * @property {number} character - The 0-based character index.
 */
export interface Position {
  line: number; // 0-based line number
  character: number; // 0-based character index
}

/**
 * Represents a range with a start and end position.
 */
export interface Range {
  start: Position;
  end: Position;
}

/**
 * Compares two `Position` objects to determine if they are equal.
 *
 * @param a - The first `Position` object to compare.
 * @param b - The second `Position` object to compare.
 * @returns `true` if both `Position` objects have the same line and character values, otherwise `false`.
 */
export function isPositionEqual(a: Position, b: Position): boolean {
  return a.line === b.line && a.character === b.character;
}

/**
 * Compares two `Range` objects for equality.
 *
 * @param a - The first `Range` object to compare.
 * @param b - The second `Range` object to compare.
 * @returns `true` if both `Range` objects are equal, otherwise `false`.
 */
export function isRangeEqual(a: Range, b: Range): boolean {
  return isPositionEqual(a.start, b.start) && isPositionEqual(a.end, b.end);
}

/**
 * Checks if a given position is within a specified range.
 *
 * @param position - The position to check, represented by a line and character.
 * @param range - The range to check against, defined by start and end positions.
 * @returns `true` if the position is within the range, `false` otherwise.
 */
export function isPositionInRange(position: Position, range: Range): boolean {
  if (position.line < range.start.line || position.line > range.end.line) {
    return false;
  }
  if (
    position.line === range.start.line &&
    position.character < range.start.character
  ) {
    return false;
  }
  if (
    position.line === range.end.line &&
    position.character > range.end.character
  ) {
    return false;
  }
  return true;
}

/**
 * Interface representing the information required for autocomplete functionality
 * for a specific programming language.
 */
export interface AutocompleteLanguageInfo {
  /**
   * The name of the programming language.
   */
  name: string;

  /**
   * An array of file extensions associated with the programming language.
   */
  extensions: string[];

  /**
   * The syntax for single-line comments in the programming language.
   */
  singleLineComment: string;

  /**
   * The syntax for the start of multi-line comments in the programming language.
   */
  multiLineCommentStart: string;

  /**
   * The syntax for the end of multi-line comments in the programming language.
   */
  multiLineCommentEnd: string;

  /**
   * An array of string delimiters used in the programming language.
   */
  stringDelimiters: string[];

  /**
   * An array of keywords used in the programming language.
   */
  keywords: string[];

  /**
   * An object representing the bracket pairs used in the programming language.
   * The key is the opening bracket and the value is the corresponding closing bracket.
   */
  brackets: { [key: string]: string };

  /**
   * Optional indentation rules for the programming language.
   */
  indentationRules?: {
    /**
     * A regular expression pattern that matches lines that should increase the indentation level.
     */
    increaseIndentPattern: RegExp;

    /**
     * A regular expression pattern that matches lines that should decrease the indentation level.
     */
    decreaseIndentPattern: RegExp;
  };
}

/**
 * Represents a code snippet with its content, file path, and range.
 */
export interface CodeSnippet {
  content: string;
  filepath: string;
  range: Range;
}

/**
 * Represents an autocomplete snippet that extends the base code snippet.
 *
 * @extends CodeSnippet
 *
 * @property {number} [score] - An optional score indicating the relevance of the snippet.
 */
export interface AutocompleteSnippet extends CodeSnippet {
  score?: number;
}

/**
 * Represents a symbol in the code with its associated metadata.
 *
 * @interface Symbol
 * @property {string} name - The name of the symbol.
 * @property {string} kind - The kind or type of the symbol (e.g., variable, function).
 * @property {Position} position - The position of the symbol in the code.
 * @property {string} [scope] - The scope in which the symbol is defined (optional).
 * @property {string} filepath - The file path where the symbol is located.
 * @property {Range} range - The range in the file where the symbol is defined.
 */
export interface Symbol {
  name: string;
  kind: string;
  position: Position;
  scope?: string;
  filepath: string;
  range: Range;
}

/**
 * Represents a node in an Abstract Syntax Tree (AST).
 *
 * @interface AstNode
 * @property {string} type - The type of the AST node.
 * @property {Position} startPosition - The starting position of the node in the source code.
 * @property {Position} endPosition - The ending position of the node in the source code.
 * @property {AstNode[]} [children] - Optional. The child nodes of this AST node.
 * @property {AstNode} [parent] - Optional. The parent node of this AST node.
 * @property {string} [text] - Optional. The text content of this AST node.
 */
export interface AstNode {
  type: string;
  startPosition: Position;
  endPosition: Position;
  children?: AstNode[];
  parent?: AstNode;
  text?: string;
}

/**
 * Represents the context for an autocomplete operation.
 *
 * @interface AutocompleteContext
 *
 * @property {string} prefix - The prefix string before the cursor.
 * @property {string} suffix - The suffix string after the cursor.
 * @property {string} filepath - The path of the file being edited.
 * @property {AutocompleteLanguageInfo | null} language - Information about the language of the file.
 * @property {Array<Edit>} recentEdits - A list of recent edits made in the file.
 * @property {any} astInfo - Abstract Syntax Tree (AST) information of the file.
 * @property {AutocompleteSnippet[]} relevantCodeSnippets - Snippets of code relevant to the current context.
 * @property {Array<ImportInfo>} importedSymbols - Symbols imported in the file.
 * @property {Symbol[]} nearbySymbols - Symbols located near the cursor position.
 * @property {string[]} projectSymbols - Symbols available in the entire project.
 * @property {AutocompleteSnippet[]} similarCode - Snippets of code similar to the current context.
 * @property {any} enclosingFunction - Information about the function enclosing the cursor position.
 * @property {any} dataFlowInfo - Information about the data flow in the current context.
 * @property {Symbol | null} currentSymbol - The symbol at the current cursor position, if any.
 */
export interface AutocompleteContext {
  prefix: string;
  suffix: string;
  filepath: string;
  language: AutocompleteLanguageInfo | null;
  recentEdits: Array<Edit>;
  astInfo: any;
  relevantCodeSnippets: AutocompleteSnippet[];
  importedSymbols: Array<ImportInfo>;
  nearbySymbols: Symbol[];
  projectSymbols: string[];
  similarCode: AutocompleteSnippet[];
  enclosingFunction: any;
  dataFlowInfo: any;
  currentSymbol: Symbol | null;
}

/**
 * Represents information about an import statement.
 */
export interface ImportInfo {
  name: string;
  kind: 'default' | 'named' | 'namespace';
  sourcePath: string;
  range: Range;
}

/**
 * Represents an edit operation within a file.
 *
 * @interface Edit
 *
 * @property {string} filepath - The path to the file where the edit is made.
 * @property {Range} range - The range within the file where the edit occurs.
 * @property {string} content - The content to be inserted or replaced in the specified range.
 * @property {number} timestamp - The timestamp when the edit was made.
 */
export interface Edit {
  filepath: string;
  range: Range;
  content: string;
  timestamp: number;
}

/**
 * Represents an entry in the index, which is a code snippet.
 */
export type IndexEntry = CodeSnippet;

/**
 * Interface for extracting symbols from code.
 */
export interface ISymbolExtractor {
  /**
   * Extracts all symbols from the given code.
   * @param code - The source code to extract symbols from.
   * @param filepath - The path of the file containing the code.
   * @returns A promise that resolves to an array of symbols.
   */
  extractSymbols(code: string, filepath: string): Promise<Symbol[]>;

  /**
   * Extracts symbols that are nearby a given position in the code.
   * @param code - The source code to extract symbols from.
   * @param position - The position in the code to find nearby symbols.
   * @param filepath - The path of the file containing the code.
   * @returns A promise that resolves to an array of symbols.
   */
  extractNearbySymbols(
    code: string,
    position: Position,
    filepath: string,
  ): Promise<Symbol[]>;

  /**
   * Gets the symbol at a specific position in the code.
   * @param code - The source code to extract the symbol from.
   * @param position - The position in the code to find the symbol.
   * @param filepath - The path of the file containing the code.
   * @returns A promise that resolves to the symbol at the given position, or null if no symbol is found.
   */
  getSymbolAtPosition(
    code: string,
    position: Position,
    filepath: string,
  ): Promise<Symbol | null>;
}

/**
 * Represents a suggestion for code autocompletion.
 */
export interface AutocompleteSuggestion {
  /**
   * The text of the suggestion.
   */
  text: string;

  /**
   * An optional description or additional information about the suggestion.
   */
  description?: string;

  /**
   * An optional kind or category of the suggestion (e.g., 'function', 'variable', 'class').
   */
  kind?: string;

  /**
   * An optional score or relevance of the suggestion.
   */
  score?: number;
}
