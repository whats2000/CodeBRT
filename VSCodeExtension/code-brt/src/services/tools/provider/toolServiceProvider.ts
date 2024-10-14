import type {
  NonWorkspaceToolType,
  ToolFunction,
  ToolSchema,
  ToolServicesApi,
  WorkspaceToolType,
} from '../types';

import { getToolSchema, getToolSchemaWithoutWorkspace } from '../utils';
import { webSearchTool } from '../webSearchTool';
import { urlFetcherTool } from '../urlFetcher';
import vscode from 'vscode';

export class ToolServiceProvider {
  private static readonly toolServices: {
    [key in NonWorkspaceToolType]: ToolFunction;
  } & {
    agentTools: {
      [key in WorkspaceToolType]: ToolFunction;
    };
  } = {
    webSearch: webSearchTool,
    urlFetcher: urlFetcherTool,
    agentTools: {
      executeCommand: () => {
        return Promise.resolve('Not implemented');
      },
      readFile: () => {
        return Promise.resolve('Not implemented');
      },
      writeToFile: () => {
        return Promise.resolve('Not implemented');
      },
      searchFiles: () => {
        return Promise.resolve('Not implemented');
      },
      listFiles: () => {
        return Promise.resolve('Not implemented');
      },
      listCodeDefinitionNames: () => {
        return Promise.resolve('Not implemented');
      },
      inspectSite: () => {
        return Promise.resolve('Not implemented');
      },
      askFollowUpQuestion: () => {
        return Promise.resolve('Not implemented');
      },
      attemptCompletion: () => {
        return Promise.resolve('Not implemented');
      },
    },
  };

  public static getTool(
    name: string,
  ): ToolServicesApi[keyof ToolServicesApi] | undefined {
    if (name in this.toolServices.agentTools) {
      return this.toolServices.agentTools[name as WorkspaceToolType];
    }
    if (name in this.toolServices) {
      return this.toolServices[name as NonWorkspaceToolType];
    }

    return undefined;
  }

  public static getToolSchema = (): {
    [key in NonWorkspaceToolType]: ToolSchema;
  } & {
    agentTools:
      | {
          [key in WorkspaceToolType]: ToolSchema;
        }
      | undefined;
  } => {
    const currentWorkspacePath =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!currentWorkspacePath) {
      return getToolSchemaWithoutWorkspace();
    }

    return getToolSchema(currentWorkspacePath);
  };
}
