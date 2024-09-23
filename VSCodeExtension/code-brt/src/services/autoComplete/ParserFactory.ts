// ParserFactory.ts
import { ISymbolExtractor } from './types';
import { CParser } from './ProgrammingLanguageParsers/CParser';
import { CppParser } from './ProgrammingLanguageParsers/CppParser';
import { CSharpParser } from './ProgrammingLanguageParsers/C#Parser';
import { JavaScriptParser } from './ProgrammingLanguageParsers/JavaScriptParser';
import { MarkdownParser } from './ProgrammingLanguageParsers/MarkdownParser';
import { PHPParser } from './ProgrammingLanguageParsers/PHPParser';
import { PythonParser } from './ProgrammingLanguageParsers/PythonParser';
import { RParser } from './ProgrammingLanguageParsers/RParser';
import { RubyParser } from './ProgrammingLanguageParsers/RubyParser';
import { TypeScriptParser } from './ProgrammingLanguageParsers/TypeScriptParser';
import { YAMLParser } from './ProgrammingLanguageParsers/YAMLParser';

export class ParserFactory {
  static getParser(fileExtension: string): ISymbolExtractor {
    switch (fileExtension.toLowerCase()) {
      case '.c':
      case '.h':
        return new CParser();
      case '.cpp':
      case '.hpp':
        return new CppParser();
      case '.cs':
        return new CSharpParser();
      case '.js':
        return new JavaScriptParser();
      case '.md':
        return new MarkdownParser();
      case '.php':
        return new PHPParser();
      case '.py':
        return new PythonParser();
      case '.r':
        return new RParser();
      case '.rb':
        return new RubyParser();
      case '.ts':
      case '.tsx':
        return new TypeScriptParser();
      case '.yml':
      case '.yaml':
        return new YAMLParser();
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  }
}
