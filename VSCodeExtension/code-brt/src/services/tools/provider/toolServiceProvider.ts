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
import { ToolCallEntry, ToolCallResponse } from '../../../types';

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
        throw new Error('Not implemented');
      },
      readFile: () => {
        throw new Error('Not implemented');
      },
      writeToFile: () => {
        throw new Error('Not implemented');
      },
      searchFiles: () => {
        throw new Error('Not implemented');
      },
      listFiles: () => {
        throw new Error('Not implemented');
      },
      listCodeDefinitionNames: () => {
        throw new Error('Not implemented');
      },
      inspectSite: () => {
        throw new Error('Not implemented');
      },
      askFollowUpQuestion: () => {
        throw new Error('Not implemented');
      },
      attemptCompletion: () => {
        throw new Error('Not implemented');
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

    // For WorkspaceToolType, we need to check if the tool exists in the agentTools
    if (toolSchema.agentTools && toolName in toolSchema.agentTools) {
      return toolSchema.agentTools[toolName as WorkspaceToolType];
    }

    // Otherwise, the schema doesn't exist
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
        feedback:
          `The tool "${toolCallEntry.toolName}" does not exist. ` +
          `Check the tool name and try again.`,
      };
    }

    // Validate if the tool schema exists
    const toolSchema = this.getToolSchemaByToolName(toolCallEntry.toolName);

    if (!toolSchema) {
      return {
        isValid: false,
        feedback:
          `The tool "${toolCallEntry.toolName}" does not have a schema. ` +
          `This mean the tool is working in progress.`,
      };
    }

    // Validate if the tool call has the required parameters
    const requiredParameters = toolSchema.inputSchema.required;
    for (const parameter of requiredParameters) {
      // Check if the parameter is present in the tool call
      if (!(parameter in toolCallEntry.parameters)) {
        return {
          isValid: false,
          feedback:
            `The tool "${toolCallEntry.toolName}" requires the parameter "${parameter}". ` +
            `Please provide the parameter and try again.`,
        };
      }
    }

    // Validate if the tool call has the correct parameter types
    for (const [parameter, value] of Object.entries(toolCallEntry.parameters)) {
      const parameterType = toolSchema.inputSchema.properties[parameter].type;
      if (typeof value !== parameterType) {
        return {
          isValid: false,
          feedback:
            `The parameter "${parameter}" of the tool "${toolCallEntry.toolName}" is invalid. ` +
            `Please provide the correct parameter type and try again.`,
        };
      }
    }

    return {
      isValid: true,
      feedback: '',
    };
  }

  public static async executeToolCall(
    ToolCallEntry: ToolCallEntry,
    updateStatus: (status: string) => void,
  ): Promise<ToolCallResponse> {
    try {
      const tool = this.getTool(ToolCallEntry.toolName);

      if (!tool) {
        return {
          id: ToolCallEntry.id,
          toolCallName: ToolCallEntry.toolName,
          result: 'The tool does not exist',
          status: 'error',
          create_time: Date.now(),
        };
      }

      const args = { ...ToolCallEntry.parameters, updateStatus };
      const result = await tool(args as any);
      return {
        id: ToolCallEntry.id,
        toolCallName: ToolCallEntry.toolName,
        result: result,
        status: 'success',
        create_time: Date.now(),
      };
    } catch (error) {
      return {
        id: ToolCallEntry.id,
        toolCallName: ToolCallEntry.toolName,
        result:
          'There was an error executing the tool, please report this issue',
        status: 'error',
        create_time: Date.now(),
      };
    }
  }
}
