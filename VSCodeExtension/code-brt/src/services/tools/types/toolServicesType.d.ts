export type ToolServiceType = 'webSearch' | 'urlFetcher';

export type ToolSchema = {
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
