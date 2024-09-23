// SimilarityMatcher.ts

import { CodeSnippet } from './types';

export class SimilarityMatcher {
  private codebase: CodeSnippet[] = [];

  constructor(codebase: CodeSnippet[]) {
    this.codebase = codebase;
  }

  async findSimilarCode(
    query: string,
    threshold: number = 0.7,
    limit: number = 5,
  ): Promise<CodeSnippet[]> {
    const queryTokens = this.tokenize(query);
    const results = this.codebase
      .map((snippet) => ({
        ...snippet,
        similarity: this.calculateCosineSimilarity(
          queryTokens,
          this.tokenize(snippet.content),
        ),
      }))
      .filter((result) => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return results;
  }

  private tokenize(code: string): Map<string, number> {
    const tokens = code
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 0);
    const tokenMap = new Map<string, number>();
    for (const token of tokens) {
      tokenMap.set(token, (tokenMap.get(token) || 0) + 1);
    }
    return tokenMap;
  }

  private calculateCosineSimilarity(
    tokens1: Map<string, number>,
    tokens2: Map<string, number>,
  ): number {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (const [token, count] of tokens1) {
      dotProduct += count * (tokens2.get(token) || 0);
      magnitude1 += count * count;
    }

    for (const [, count] of tokens2) {
      magnitude2 += count * count;
    }

    return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
  }

  async slidingWindowMatch(
    recentFiles: CodeSnippet[],
    windowAroundCursor: string,
    topN: number,
    windowSize: number,
  ): Promise<CodeSnippet[]> {
    const results: Array<CodeSnippet & { similarity: number }> = [];

    for (const file of recentFiles) {
      const windows = this.generateWindows(file.content, windowSize);
      for (const window of windows) {
        const similarity = this.calculateCosineSimilarity(
          this.tokenize(window),
          this.tokenize(windowAroundCursor),
        );
        results.push({ ...file, content: window, similarity });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, topN);
  }

  private *generateWindows(
    text: string,
    windowSize: number,
  ): Generator<string> {
    const lines = text.split('\n');
    for (let i = 0; i <= lines.length - windowSize; i++) {
      yield lines.slice(i, i + windowSize).join('\n');
    }
  }
}

// 代碼片段相似度匹配：

// 透過 findSimilarCode 方法，根據 Jaccard 相似性度量，匹配代碼庫中與查詢片段相似的代碼。
// tokenize 方法會將代碼分割成一組標記（tokens），用於比較。
// calculateJaccardSimilarity 方法根據兩組標記的交集與聯集來計算 Jaccard 相似性。
// 滑動窗口匹配：

// slidingWindowMatch 方法允許根據滑動窗口技術從最近的檔案中匹配相似代碼段，主要用於查詢附近的小片段。
// generateWindows 方法將長文本按指定的窗口大小生成滑動窗口，便於逐段匹配。

// 主要用於查找代碼片段的相似性
