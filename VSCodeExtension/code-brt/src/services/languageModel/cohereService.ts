import * as vscode from 'vscode';
import type { Message, Tool, ToolCall, ToolResult } from 'cohere-ai/api';
import { CohereClient } from 'cohere-ai';

import type {
  ConversationEntry,
  GetResponseOptions,
  ToolServiceType,
} from '../../types';
import { MODEL_SERVICE_CONSTANTS, toolsSchema } from '../../constants';
import { mapTypeToPythonFormat } from '../../utils';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import { HistoryManager, SettingsManager } from '../../api';
import { ToolService } from '../tools';

export class CohereService extends AbstractLanguageModelService {
  private readonly tools: Tool[] = [];

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    historyManager: HistoryManager,
  ) {
    const availableModelNames = settingsManager.get('cohereAvailableModels');
    const defaultModelName = settingsManager.get('lastSelectedModel').cohere;

    super(
      'cohere',
      context,
      settingsManager,
      historyManager,
      defaultModelName,
      availableModelNames,
    );

    this.tools = this.buildTools();
  }

  private buildTools(): Tool[] {
    return Object.keys(toolsSchema).map((toolKey) => {
      const tool = toolsSchema[toolKey as ToolServiceType];
      const parameterDefinitions = Object.keys(
        tool.inputSchema.properties,
      ).reduce(
        (acc, key) => {
          const property = tool.inputSchema.properties[key];
          acc[key] = {
            description: property.description,
            type: mapTypeToPythonFormat(property.type),
            required: tool.inputSchema.required.includes(key),
          };
          return acc;
        },
        {} as {
          [key: string]: {
            description: string;
            type: string;
            required: boolean;
          };
        },
      );

      return {
        name: tool.name,
        description: tool.description,
        parameterDefinitions,
      };
    });
  }

  private conversationHistoryToContent(entries: {
    [key: string]: ConversationEntry;
  }): Message[] {
    let result: Message[] = [];
    let currentEntry = entries[this.history.current];

    while (currentEntry) {
      result.unshift({
        role: currentEntry.role === 'AI' ? 'CHATBOT' : 'USER',
        message: currentEntry.message,
      });

      if (currentEntry.parent) {
        currentEntry = entries[currentEntry.parent];
      } else {
        break;
      }
    }

    // Cohere's API doesn't include the query message
    if (result.length > 0 && result[result.length - 1].role === 'USER') {
      result.pop();
    }

    return result;
  }

  private async handleFunctionCalls(
    functionCalls: ToolCall[],
    updateStatus?: (status: string) => void,
  ): Promise<ToolResult[]> {
    const functionCallResults: ToolResult[] = [];

    for (const functionCall of functionCalls) {
      const tool = ToolService.getTool(functionCall.name);
      if (!tool) {
        functionCallResults.push({
          call: functionCall,
          outputs: [
            {
              error: true,
              message: `Failed to find tool with name: ${functionCall.name}`,
            },
          ],
        });
        continue;
      }

      try {
        const result = await tool({
          ...functionCall.parameters,
          updateStatus,
        } as any);
        functionCallResults.push({
          call: functionCall,
          outputs: [
            {
              searchResults: result,
            },
          ],
        });
      } catch (error) {
        functionCallResults.push({
          call: functionCall,
          outputs: [
            {
              error: true,
              message: `Error executing tool ${functionCall.name}: ${error}`,
            },
          ],
        });
      }
    }

    return functionCallResults;
  }

  public async getLatestAvailableModelNames(): Promise<string[]> {
    const cohere = new CohereClient({
      token: this.settingsManager.get('cohereApiKey'),
    });

    let newAvailableModelNames: string[] = [...this.availableModelNames];

    try {
      const latestModels = (await cohere.models.list()).models;

      // Filter the invalid models out of the available models
      newAvailableModelNames = newAvailableModelNames.filter((name) =>
        latestModels.some((model) => model.name === name),
      );

      // Append the models to the available models if they aren't already there
      latestModels.forEach((model) => {
        if (!model.name || !model.endpoints) return;
        if (newAvailableModelNames.includes(model.name)) return;
        if (!model.endpoints.includes('chat')) return;

        newAvailableModelNames.push(model.name);
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to fetch available models: ' + error,
      );
    }

    return newAvailableModelNames;
  }

  public async getResponse(options: GetResponseOptions): Promise<string> {
    if (this.currentModel === '') {
      vscode.window.showErrorMessage(
        'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
      );
      return 'Missing model configuration. Check the model selection dropdown.';
    }

    const { query, images, currentEntryID, sendStreamResponse, updateStatus } =
      options;

    if (images && images.length > 0) {
      vscode.window.showWarningMessage(
        'The images inference is not supported currently. The images will be ignored.',
      );
    }

    const model = new CohereClient({
      token: this.settingsManager.get('cohereApiKey'),
    });

    let conversationHistory = this.conversationHistoryToContent(
      this.getHistoryBeforeEntry(currentEntryID).entries,
    );

    let toolResults: ToolResult[] = [];
    let functionCallCount = 0;
    const MAX_FUNCTION_CALLS = 5;
    try {
      if (!sendStreamResponse) {
        while (functionCallCount < MAX_FUNCTION_CALLS) {
          const response = await model.chat({
            model: this.currentModel,
            message: toolResults.length > 0 ? '' : query,
            chatHistory: conversationHistory,
            tools: this.currentModel !== 'command' ? this.tools : undefined,
            toolResults: toolResults.length > 0 ? toolResults : undefined,
          });

          if (response.chatHistory) {
            conversationHistory = response.chatHistory;
          }

          const functionCalls = response.toolCalls;

          if (!functionCalls) {
            return response.text;
          }

          toolResults = await this.handleFunctionCalls(functionCalls);
          functionCallCount++;
        }
        return 'Max function call limit reached.';
      } else {
        let responseText = '';

        while (functionCallCount < MAX_FUNCTION_CALLS) {
          const streamResponse = await model.chatStream({
            model: this.currentModel,
            message: toolResults.length > 0 ? '' : query,
            chatHistory: conversationHistory,
            tools: this.currentModel !== 'command' ? this.tools : undefined,
            toolResults: toolResults.length > 0 ? toolResults : undefined,
          });

          let functionCalls = null;

          for await (const item of streamResponse) {
            if (item.eventType === 'stream-start') {
              updateStatus && updateStatus('');
            }
            if (item.eventType === 'tool-calls-generation') {
              functionCalls = item.toolCalls;
              toolResults = await this.handleFunctionCalls(
                functionCalls,
                updateStatus,
              );
            }
            if (item.eventType === 'text-generation') {
              const partText = item.text;
              sendStreamResponse(partText);
              responseText += partText;
            }
            if (item.eventType === 'stream-end' && item.response.chatHistory) {
              conversationHistory = item.response.chatHistory;
            }
          }
          if (!functionCalls || functionCalls.length === 0) {
            return responseText;
          }
          functionCallCount++;
        }
        return responseText;
      }
    } catch (error) {
      vscode.window
        .showErrorMessage(
          'Failed to get response from Cohere Service: ' + error,
          'Get API Key',
        )
        .then((selection) => {
          if (selection === 'Get API Key') {
            vscode.env.openExternal(
              vscode.Uri.parse(MODEL_SERVICE_CONSTANTS.cohere.apiLink),
            );
          }
        });
      return 'Failed to connect to the language model service.';
    }
  }
}
