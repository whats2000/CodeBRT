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
   * @returns An array of search results.
   */
  webSearch: (
    query: string,
    updateStatus?: (status: string) => void,
  ) => Promise<
    {
      title: string;
      url: string;
      snippet: string;
    }[]
  >;
};
