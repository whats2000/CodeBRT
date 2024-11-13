import { NonWorkspaceToolType, ToolSchema, WorkspaceToolType } from '../types';
import {
  urlFetcherSchema,
  webSearchSchema,
  executeCommandSchema,
  askFollowUpQuestionSchema,
  attemptCompletionSchema,
  inspectSiteSchema,
  listCodeDefinitionNamesSchema,
  listFilesSchema,
  readFileSchema,
  searchFilesSchema,
  writeToFileSchema,
} from '../constants';

export const getToolSchema = (
  currentWorkspacePath: string,
): {
  [key in NonWorkspaceToolType]: ToolSchema;
} & {
  agentTools: {
    [key in WorkspaceToolType]: ToolSchema;
  };
} => {
  return {
    webSearch: webSearchSchema,
    urlFetcher: urlFetcherSchema,
    agentTools: {
      executeCommand: executeCommandSchema(currentWorkspacePath),
      readFile: readFileSchema(currentWorkspacePath),
      writeToFile: writeToFileSchema(currentWorkspacePath),
      searchFiles: searchFilesSchema(currentWorkspacePath),
      listFiles: listFilesSchema(currentWorkspacePath),
      listCodeDefinitionNames:
        listCodeDefinitionNamesSchema(currentWorkspacePath),
      inspectSite: inspectSiteSchema,
      askFollowUpQuestion: askFollowUpQuestionSchema,
      attemptCompletion: attemptCompletionSchema,
    },
  };
};

export const getToolSchemaWithoutWorkspace = (): {
  [key in NonWorkspaceToolType]: ToolSchema;
} & {
  agentTools: undefined;
} => {
  return {
    webSearch: webSearchSchema,
    urlFetcher: urlFetcherSchema,
    agentTools: undefined,
  };
};
