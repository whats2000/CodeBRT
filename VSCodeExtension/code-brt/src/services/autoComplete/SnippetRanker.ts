// SnippetRanker.ts

import { AutocompleteSnippet } from './types';

export class SnippetRanker {
  /**
   * Ranks the given snippets based on their relevance to the provided context.
   *
   * @param snippets - An array of `AutocompleteSnippet` objects to be ranked.
   * @param context - A string representing the context to rank the snippets against.
   * @returns An array of `AutocompleteSnippet` objects sorted by their calculated relevance score in descending order.
   */
  rankSnippets(
    snippets: AutocompleteSnippet[],
    context: string,
  ): AutocompleteSnippet[] {
    return snippets
      .map((snippet) => ({
        ...snippet,
        score: this.calculateScore(snippet, context),
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  /**
   * Calculates the similarity score between a given snippet and a context string.
   * The score is determined by the ratio of the intersection to the union of words
   * in the snippet and the context.
   *
   * @param snippet - The autocomplete snippet containing the content to be scored.
   * @param context - The context string to compare against the snippet content.
   * @returns The similarity score as a number between 0 and 1.
   */
  private calculateScore(
    snippet: AutocompleteSnippet,
    context: string,
  ): number {
    const snippetWords = new Set(snippet.content.toLowerCase().split(/\W+/));
    const contextWords = new Set(context.toLowerCase().split(/\W+/));
    const intersection = new Set(
      [...snippetWords].filter((x) => contextWords.has(x)),
    );
    const union = new Set([...snippetWords, ...contextWords]);

    return intersection.size / union.size;
  }

  fillPromptWithSnippets(
    snippets: AutocompleteSnippet[],
    limit: number,
  ): AutocompleteSnippet[] {
    // Simply return the top N snippets
    return snippets.slice(0, limit);
  }
}
