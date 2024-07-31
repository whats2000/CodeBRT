export type ToolFunction = (...args: any[]) => Promise<string>;

export type ToolServicesApi = {
  /**
   * Perform a web search and return the results.
   * @param args.query The search query.
   * @param args.numResults The number of search results to return.
   * @param args.maxCharsPerPage The maximum number of characters to include in each search result.
   * @param args.format The format of the search results.
   * Either 'text' as a document like or 'json' as JSON string.
   * @param args.updateStatus A function to update the status of the search.
   * @returns The search results as a string.
   * @example Example response:
   *
   * **Title**:
   * Example Title
   * **URL**:
   * https://example.com
   * **Snippet**:
   * This is an example snippet.
   *
   * **Title**:
   * Another Example Title
   * **URL**:
   * https://example.com/another
   * **Snippet**:
   * This is another example snippet.
   */
  webSearch: (args: {
    query: string;
    numResults?: number | string;
    maxCharsPerPage?: number | string;
    format?: 'text' | 'json';
    updateStatus?: (status: string) => void;
  }) => Promise<string>;
};
