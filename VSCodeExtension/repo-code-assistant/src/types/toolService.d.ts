import { ToolServiceType } from './toolServicesType';

export type ToolFunction = ToolServicesApi[keyof ToolServicesApi];

export type ToolService = {
  /**
   * The name of the tool.
   */
  name: ToolServiceType;

  /**
   * Execute the tool with the given parameters.
   * @param params - The parameters for the tool.
   * @returns The result of the tool execution.
   */
  execute: ToolServicesApi[keyof ToolServicesApi];
};

export type ToolServicesApi = {
  /**
   * Perform a web search and return the results.
   * @param query - The search query.
   * @param updateStatus - Optional callback to update the status.
   * @param maxCharsPerPage - Optional maximum number of characters per page.
   * @param numResults - Optional number of search results to return.
   * @returns An array of search results. The array contains objects with the following properties:
   * - title: The title of the search result.
   * - url: The URL of the search result.
   * - snippet: A snippet of text from the search result.
   */
  webSearch: (
    query: string,
    updateStatus?: (status: string) => void,
    maxCharsPerPage?: number,
    numResults?: number,
  ) => Promise<
    {
      title: string;
      url: string;
      snippet: string;
    }[]
  >;
};
