export type WorkspaceToolType =
  | 'executeCommand'
  | 'readFile'
  | 'writeToFile'
  | 'searchFiles'
  | 'listFiles'
  | 'listCodeDefinitionNames'
  | 'inspectSite'
  | 'askFollowUpQuestion'
  | 'attemptCompletion';

export type NonWorkspaceToolType = 'webSearch' | 'urlFetcher';

export type ToolServiceType = 'agentTools' | NonWorkspaceToolType;

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
