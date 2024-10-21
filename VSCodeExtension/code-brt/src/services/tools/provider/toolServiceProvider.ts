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
import { ToolCallEntry } from '../../../types';

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

  public static getToolSchemaByToolName(
    toolName: string,
  ): ToolSchema | undefined {
    const tool = this.getTool(toolName);
    if (!tool) {
      return undefined;
    }

    const toolSchema = this.getToolSchema();

    // For NonWorkspaceToolType we can directly return the schema
    if (toolName in toolSchema && toolName !== 'agentTools') {
      return toolSchema[toolName as NonWorkspaceToolType];
    }

    // For WorkspaceToolType we need to check if the tool exists in the agentTools
    if (toolSchema.agentTools && toolName in toolSchema.agentTools) {
      return toolSchema.agentTools[toolName as WorkspaceToolType];
    }

    // Otherwise the schema does not exist
    return undefined;
  }

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

  public static isViableToolCall(toolCallEntry: ToolCallEntry): {
    isValid: boolean;
    feedback: string;
  } {
    const tool = this.getTool(toolCallEntry.toolName);

    // Validate if the tool exists
    if (!tool) {
      return {
        isValid: false,
        feedback: `The tool "${toolCallEntry.toolName}" does not exist.`,
      };
    }

    // Validate if the tool schema exists
    const toolSchema = this.getToolSchemaByToolName(toolCallEntry.toolName);

    if (!toolSchema) {
      return {
        isValid: false,
        feedback: `The tool "${toolCallEntry.toolName}" does not have a schema.`,
      };
    }

    // Validate if the tool call has the required parameters
    const requiredParameters = toolSchema.inputSchema.required;
    for (const parameter of requiredParameters) {
      // Check if the parameter is present in the tool call
      if (!(parameter in toolCallEntry.parameters)) {
        return {
          isValid: false,
          feedback: `The tool "${toolCallEntry.toolName}" requires the parameter "${parameter}".`,
        };
      }
    }

    // Validate if the tool call has the correct parameter types
    for (const [parameter, value] of Object.entries(toolCallEntry.parameters)) {
      const parameterType = toolSchema.inputSchema.properties[parameter].type;
      if (typeof value !== parameterType) {
        return {
          isValid: false,
          feedback: `The parameter "${parameter}" of the tool "${toolCallEntry.toolName}" is invalid. Expected type "${parameterType}" but received type "${typeof value}".`,
        };
      }
    }

    return {
      isValid: true,
      feedback: '',
    };
  }
}
