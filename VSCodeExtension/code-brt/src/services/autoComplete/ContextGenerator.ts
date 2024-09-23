//ContextGenerator.ts

import {
  AutocompleteContext,
  Position,
  AutocompleteLanguageInfo,
  ISymbolExtractor,
  AstNode,
} from './types';
import { RecentEditsManager } from './RecentEditsManager';
import { CodeAnalyzer } from './CodeAnalyzer';
import { CodebaseIndexer } from './CodebaseIndexer';
import { ImportAnalyzer } from './ImportAnalyzer';
import { SimilarityMatcher } from './SimilarityMatcher';
import { LanguageDetector } from './LanguageDetector';
import { SnippetRanker } from './SnippetRanker';

export class ContextGenerator {
  constructor(
    private recentEditsManager: RecentEditsManager,
    private CodeAnalyzer: CodeAnalyzer,
    private codebaseIndexer: CodebaseIndexer,
    private importAnalyzer: ImportAnalyzer,
    private similarityMatcher: SimilarityMatcher,
    public languageDetector: LanguageDetector,
    private snippetRanker: SnippetRanker,
  ) {}

  async generateContext(
    filepath: string,
    cursorPosition: Position,
    fileContents: string,
    parser: ISymbolExtractor,
    language: AutocompleteLanguageInfo | null,
  ): Promise<AutocompleteContext> {
    if (!language) {
      language = this.languageDetector.detectLanguage(filepath);
    }

    const [prefix, suffix] = this.splitContentAtCursor(
      fileContents,
      cursorPosition,
    );

    const [
      recentEdits,
      importedSymbolsRaw,
      projectSymbols,
      similarCode,
      nearbySymbols,
      currentSymbol,
    ] = await Promise.all([
      this.recentEditsManager.getRecentEdits(filepath),
      this.importAnalyzer.analyzeFile(filepath),
      this.codebaseIndexer.getProjectSymbols(),
      this.similarityMatcher.findSimilarCode(prefix + suffix),
      parser.extractNearbySymbols(fileContents, cursorPosition, filepath),
      parser.getSymbolAtPosition(fileContents, cursorPosition, filepath),
    ]);

    const astInfo = await this.CodeAnalyzer.getInfoAtCursor(
      fileContents,
      filepath,
      cursorPosition,
    );
    const relevantSnippets = await this.codebaseIndexer.getRelevantSnippets(
      prefix,
      suffix,
    );
    const rankedSnippets = this.snippetRanker.rankSnippets(
      relevantSnippets,
      prefix + suffix,
    );
    const enclosingFunction = await this.CodeAnalyzer.getEnclosingFunction(
      fileContents,
      filepath,
      cursorPosition,
    );
    const dataFlowInfo = await this.performDataFlowAnalysis(
      fileContents,
      filepath,
      cursorPosition,
    );

    const importedSymbols = Object.entries(importedSymbolsRaw).map(
      ([name, info]) => ({
        name,
        sourcePath: info.sourcePath,
        kind: info.kind,
        range: info.range,
      }),
    );

    return {
      prefix,
      suffix,
      filepath,
      language,
      recentEdits,
      astInfo,
      relevantCodeSnippets: rankedSnippets,
      importedSymbols,
      nearbySymbols,
      projectSymbols: projectSymbols.map((s) => s.name),
      similarCode,
      enclosingFunction,
      dataFlowInfo,
      currentSymbol,
    };
  }

  private splitContentAtCursor(
    content: string,
    cursorPosition: Position,
  ): [string, string] {
    const lines = content.split('\n');
    const prefixLines = lines.slice(0, cursorPosition.line);
    const suffixLines = lines.slice(cursorPosition.line);

    const prefix = [
      ...prefixLines,
      suffixLines[0].slice(0, cursorPosition.character),
    ].join('\n');

    const suffix = [
      suffixLines[0].slice(cursorPosition.character),
      ...suffixLines.slice(1),
    ].join('\n');

    return [prefix, suffix];
  }

  private getDefaultLanguage(): AutocompleteLanguageInfo {
    return {
      name: 'TypeScript',
      extensions: ['.ts', '.tsx'],
      singleLineComment: '//',
      multiLineCommentStart: '/*',
      multiLineCommentEnd: '*/',
      stringDelimiters: ['"', "'", '`'],
      keywords: [
        'function',
        'class',
        'interface',
        'type',
        'enum',
        'const',
        'let',
        'var',
      ],
      brackets: { '(': ')', '[': ']', '{': '}' },
      indentationRules: {
        increaseIndentPattern:
          /^(.*\{[^}]*|\s*(public|private|protected)\s*$)$/,
        decreaseIndentPattern: /^\s*\}.*$/,
      },
    };
  }

  private async performDataFlowAnalysis(
    fileContents: string,
    filepath: string,
    cursorPosition: Position,
  ): Promise<any> {
    const enclosingFunction = this.CodeAnalyzer.getEnclosingFunction(
      fileContents,
      filepath,
      cursorPosition,
    );
    if (!enclosingFunction) {
      return { variableUsages: [], dataFlowPaths: [] };
    }

    const ast = await this.CodeAnalyzer.getAst(
      fileContents,
      (
        this.languageDetector.detectLanguage(filepath) ||
        this.getDefaultLanguage()
      ).name,
    );

    const variablesInScope = await this.CodeAnalyzer.getVariablesInScope(
      fileContents,
      filepath,
      cursorPosition,
    );
    const variableUsages = this.analyzeVariableUsages(ast, variablesInScope);
    const dataFlowPaths = this.analyzeDataFlowPaths(ast, variableUsages);

    return { variableUsages, dataFlowPaths };
  }

  // 分析變量的使用情況
  private analyzeVariableUsages(
    ast: AstNode,
    variables: string[],
  ): { variable: string; position: Position; usageType: string }[] {
    const usages: {
      variable: string;
      position: Position;
      usageType: string;
    }[] = [];

    // 遍歷 AST，查找變量的使用情況
    const traverseAst = (node: AstNode) => {
      if (
        node.type === 'identifier' &&
        'text' in node &&
        variables.includes(node.text as string)
      ) {
        // 收集變量使用信息
        usages.push({
          variable: (node as any).text,
          position: node.startPosition,
          usageType: 'usage', // 使用類型，如賦值、引用等
        });
      }
      node.children?.forEach(traverseAst);
    };

    traverseAst(ast);

    return usages;
  }

  // 追蹤變量的數據流路徑
  private analyzeDataFlowPaths(ast: AstNode, variableUsages: any[]): any[] {
    const dataFlowPaths: {
      variableName: string;
      from: Position;
      to: Position | null;
    }[] = [];

    // 根據變量使用情況，分析變量如何在代碼中傳遞
    variableUsages.forEach((usage) => {
      const flowPath = {
        variableName: usage.variable,
        from: usage.position,
        to: this.findNextUsage(ast, usage), // 假設這裡有一個邏輯來找到下一次使用
      };
      dataFlowPaths.push(flowPath);
    });

    return dataFlowPaths;
  }

  // 找到變量的下一次使用
  private findNextUsage(ast: AstNode, usage: any): Position | null {
    let nextUsagePosition: Position | null = null;

    const traverseAst = (node: AstNode) => {
      if (
        node.type === 'identifier' &&
        'text' in node &&
        node.text === usage.variable
      ) {
        if (
          node.startPosition.line > usage.position.line ||
          (node.startPosition.line === usage.position.line &&
            node.startPosition.character > usage.position.character)
        ) {
          nextUsagePosition = node.startPosition;
          return; // 停止遍歷
        }
      }
      node.children?.forEach(traverseAst);
    };

    traverseAst(ast);

    return nextUsagePosition;
  }
}
