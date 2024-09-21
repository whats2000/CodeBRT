import type { ToolServiceType } from '../types';

export const webSearchSchema = {
  name: 'webSearch',
  description: `Use this tool to fetch the latest information from the web, especially for time-sensitive or recent data.`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'The query to search for. Ensure the query is specific and well-defined to get precise results.',
      },
      maxCharsPerPage: {
        type: 'number',
        description:
          'The maximum number of characters to extract from each webpage. Default is 6000. Adjust if a different limit is required.',
      },
      numResults: {
        type: 'number',
        description:
          'The number of results to return. Default is 4. Modify if more or fewer results are needed.',
      },
    },
    required: ['query'],
  },
};

export const urlFetcherSchema = {
  name: 'urlFetcher',
  description: `Use this tool to fetch and extract content from a specific URL. This is particularly useful for retrieving information from known sources.`,
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description:
          'The URL of the webpage to fetch and extract content from. Ensure the URL is valid.',
      },
      maxCharsPerPage: {
        type: 'number',
        description:
          'The maximum number of characters to extract from the webpage. Default is 6000. Adjust if a different limit is required.',
      },
    },
    required: ['url'],
  },
};

export const toolsSchema: {
  [key in ToolServiceType]: {
    name: string;
    description: string;
    inputSchema: {
      type: string;
      properties: {
        [key: string]: {
          type: string;
          description: string;
        };
      };
      required: string[];
    };
  };
} = {
  webSearch: webSearchSchema,
  urlFetcher: urlFetcherSchema,
};
