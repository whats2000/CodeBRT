//ContextCollector.ts

import { AutocompleteContext, Position } from './types';
import { CacheManager } from './CacheManager';
import { ContextGenerator } from './ContextGenerator';
import { RecentEditsManager } from './RecentEditsManager';
import { CodeAnalyzer } from './CodeAnalyzer';
import { CodebaseIndexer } from './CodebaseIndexer';
import { ImportAnalyzer } from './ImportAnalyzer';
import { SimilarityMatcher } from './SimilarityMatcher';
import { LanguageDetector } from './LanguageDetector';
import { SnippetRanker } from './SnippetRanker';
import { ParserFactory } from './ParserFactory';
import * as path from 'path';

/**
 * The `ContextCollector` class is responsible for collecting and caching
 * the context required for autocomplete functionality.
 *
 * @class
 * @property {CacheManager} cacheManager - Manages caching of contexts.
 * @property {ContextGenerator} contextGenerator - Generates context based on the provided parameters.
 *
 * @constructor
 * @param {number} [maxCacheSize=100] - Maximum size of the cache.
 * @param {number} [maxCacheAge=5000] - Maximum age of cache entries in milliseconds.
 * @param {RecentEditsManager} recentEditsManager - Manages recent edits.
 * @param {CodeAnalyzer} CodeAnalyzer - Analyzes the code.
 * @param {CodebaseIndexer} codebaseIndexer - Indexes the codebase.
 * @param {ImportAnalyzer} importAnalyzer - Analyzes imports in the code.
 * @param {SimilarityMatcher} similarityMatcher - Matches similar code snippets.
 * @param {LanguageDetector} languageDetector - Detects the programming language of the code.
 * @param {SnippetRanker} snippetRanker - Ranks code snippets.
 *
 * @method
 * @async
 * @name collectContext
 * @param {string} filepath - The path of the file for which context is being collected.
 * @param {Position} cursorPosition - The position of the cursor in the file.
 * @param {string} fileContents - The contents of the file.
 * @returns {Promise<AutocompleteContext>} - The context required for autocomplete.
 */
export class ContextCollector {
  private cacheManager: CacheManager;
  private contextGenerator: ContextGenerator;

  constructor(
    maxCacheSize: number = 100,
    maxCacheAge: number = 5000,
    recentEditsManager: RecentEditsManager,
    CodeAnalyzer: CodeAnalyzer,
    codebaseIndexer: CodebaseIndexer,
    importAnalyzer: ImportAnalyzer,
    similarityMatcher: SimilarityMatcher,
    languageDetector: LanguageDetector,
    snippetRanker: SnippetRanker,
  ) {
    this.cacheManager = new CacheManager(maxCacheSize, maxCacheAge);
    this.contextGenerator = new ContextGenerator(
      recentEditsManager,
      CodeAnalyzer,
      codebaseIndexer,
      importAnalyzer,
      similarityMatcher,
      languageDetector,
      snippetRanker,
    );
  }

  /**
   * Collects the context for autocomplete suggestions based on the provided file path, cursor position, and file contents.
   *
   * @param filepath - The path of the file for which context is being collected.
   * @param cursorPosition - The position of the cursor within the file.
   * @param fileContents - The entire contents of the file.
   * @returns A promise that resolves to an `AutocompleteContext` object containing the collected context.
   */
  async collectContext(
    filepath: string,
    cursorPosition: Position,
    fileContents: string,
  ): Promise<AutocompleteContext> {
    const cacheKey = this.cacheManager.generateCacheKey(
      filepath,
      cursorPosition,
      fileContents,
    );
    const cachedContext = this.cacheManager.get(cacheKey);

    if (cachedContext) {
      return cachedContext;
    }

    const fileExtension = path.extname(filepath);
    const parser = ParserFactory.getParser(fileExtension);
    const language =
      this.contextGenerator.languageDetector.detectLanguage(filepath);

    const context = await this.contextGenerator.generateContext(
      filepath,
      cursorPosition,
      fileContents,
      parser,
      language,
    );

    this.cacheManager.set(cacheKey, context);

    return context;
  }
}
