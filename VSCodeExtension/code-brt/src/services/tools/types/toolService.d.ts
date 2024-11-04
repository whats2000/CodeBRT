export type ToolResponseFromToolFunction = {
  status: 'success' | 'error';
  result: string;
};

export type ToolFunction = (
  ...args: any[]
) => Promise<ToolResponseFromToolFunction>;

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
   */
  webSearch: (args: {
    query: string;
    numResults?: number | string;
    maxCharsPerPage?: number | string;
    format?: 'text' | 'json';
    updateStatus?: (status: string) => void;
  }) => Promise<ToolResponseFromToolFunction>;

  /**
   * Fetch the content of a URL and return it.
   * @param args.url The URL to fetch.
   * @param args.maxCharsPerPage The maximum number of characters to include in each page.
   * @param args.format The format of the content.
   * Either 'text' as a document like or 'json' as JSON string.
   * @param args.updateStatus A function to update the status of the fetch.
   * @returns The content of the URL as a string.
   */
  urlFetcher: (args: {
    url: string;
    maxCharsPerPage?: number | string;
    format?: 'text' | 'json';
    updateStatus?: (status: string) => void;
  }) => Promise<ToolResponseFromToolFunction>;

  /**
   * List files and directories within the specified directory.
   * @param args.relativePath The relative path of the directory to list files from.
   * @param args.recursive Whether to list files recursively.
   * @param args.limit The maximum number of files to list.
   * @param args.updateStatus A function to update the status of the listing.
   * @returns The list of files and directories as a string.
   */
  listFiles: (args: {
    relativePath: string;
    recursive?: boolean;
    limit?: number;
    updateStatus?: (status: string) => void;
  }) => Promise<ToolResponseFromToolFunction>;

  /**
   * List the names of code definitions in the specified file.
   * @param args.relativePath The relative path of the file to list code definitions from.
   * @param args.updateStatus A function to update the status of the listing.
   * @returns The list of code definitions as a string.
   */
  writeToFile: (args: {
    relativePath: string;
    content: string;
    updateStatus?: (status: string) => void;
  }) => Promise<ToolResponseFromToolFunction>;

  /**
   * Read the content of the specified file.
   * @param args.relativeFilePath The relative path of the file to read content from.
   * @param args.updateStatus A function to update the status of the reading.
   * @returns The content of the file as a string.
   */
  readFile: (args: {
    relativeFilePath: string;
    updateStatus?: (status: string) => void;
  }) => Promise<ToolResponseFromToolFunction>;
};
