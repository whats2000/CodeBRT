import * as vscode from 'vscode';
import type { Message, Tool, ToolCall, ToolResult } from 'cohere-ai/api';
import { CohereClient } from 'cohere-ai';

import type {
  ConversationEntry,
  GetResponseOptions,
  ToolServiceType,
} from '../../types';
import { MODEL_SERVICE_CONSTANTS, toolsSchema } from '../../constants';
import { mapTypeToPythonFormat } from './utils';
import { AbstractLanguageModelService } from './base';
import { HistoryManager, SettingsManager } from '../../api';
import { ToolService } from '../tools';
import { ChatRequest } from 'cohere-ai/api/client/requests/ChatRequest';

export class CohereService extends AbstractLanguageModelService {
  private stopStreamFlag: boolean = false;

  private readonly modelsWithoutTools = [
    'command',
    'command-light',
    'c4ai-aya-23-35b',
    'command-light-nightly',
    'c4ai-aya-23-8b',
  ];

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get('cohereAvailableModels');
    const defaultModelName = settingsManager.get('lastSelectedModel').cohere;

    super(
      'cohere',
      context,
      settingsManager,
      defaultModelName,
      availableModelNames,
    );
  }

  private getAdvanceSettings(historyManager: HistoryManager): {
    systemPrompt: string | undefined;
    generationConfig: Partial<ChatRequest>;
  } {
    const advanceSettings = historyManager.getCurrentHistory().advanceSettings;

    if (!advanceSettings) {
      return {
        systemPrompt: undefined,
        generationConfig: {},
      };
    }

    return {
      systemPrompt:
        advanceSettings.systemPrompt.length > 0
          ? advanceSettings.systemPrompt
          : undefined,
      generationConfig: {
        maxTokens: advanceSettings.maxTokens,
        temperature: advanceSettings.temperature
          ? advanceSettings.temperature / 2
          : undefined,
        k: advanceSettings.topK,
        p: advanceSettings.topP,
        presencePenalty: advanceSettings.presencePenalty
          ? (advanceSettings.presencePenalty + 2) / 4
          : undefined,
        frequencyPenalty: advanceSettings.frequencyPenalty
          ? (advanceSettings.frequencyPenalty + 2) / 4
          : undefined,
      },
    };
  }

  private getEnabledTools(): Tool[] | undefined {
    const enabledTools = this.settingsManager.get('enableTools');
    const tools: Tool[] = [];

    for (const [key, tool] of Object.entries(toolsSchema)) {
      if (!enabledTools[key as ToolServiceType].active) {
        continue;
      }

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

      tools.push({
        name: tool.name,
        description: tool.description,
        parameterDefinitions,
      });
    }

    return tools.length > 0 ? tools : undefined;
  }

  private conversationHistoryToContent(
    entries: {
      [key: string]: ConversationEntry;
    },
    historyManager: HistoryManager,
  ): Message[] {
    let result: Message[] = [];
    let currentEntry = entries[historyManager.getCurrentHistory().current];

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

    const {
      query,
      historyManager,
      images,
      currentEntryID,
      sendStreamResponse,
      updateStatus,
      selectedModelName,
      disableTools,
    } = options;

    if (images && images.length > 0) {
      vscode.window.showWarningMessage(
        'The images inference is not supported currently. The images will be ignored.',
      );
    }

    const model = new CohereClient({
      token: this.settingsManager.get('cohereApiKey'),
    });

    let conversationHistory = this.conversationHistoryToContent(
      historyManager.getHistoryBeforeEntry(currentEntryID).entries,
      historyManager,
    );

    let toolResults: ToolResult[] = [];
    let functionCallCount = 0;
    const MAX_FUNCTION_CALLS = 5;

    const { systemPrompt, generationConfig } =
      this.getAdvanceSettings(historyManager);

    if (systemPrompt) {
      conversationHistory.unshift({
        role: 'SYSTEM',
        message: systemPrompt,
      });
    }

    // Determine whether the current model should use tools
    const shouldUseTools = !this.modelsWithoutTools.includes(this.currentModel);

    try {
      if (!sendStreamResponse) {
        while (functionCallCount < MAX_FUNCTION_CALLS) {
          const response = await model.chat({
            model: selectedModelName ?? this.currentModel,
            message: toolResults.length > 0 ? '' : query,
            chatHistory: conversationHistory,
            tools:
              disableTools || !shouldUseTools
                ? undefined
                : this.getEnabledTools(),
            toolResults: toolResults.length > 0 ? toolResults : undefined,
            ...generationConfig,
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
          if (this.stopStreamFlag) {
            return responseText;
          }

          const streamResponse = await model.chatStream({
            model: selectedModelName ?? this.currentModel,
            message: toolResults.length > 0 ? '' : query,
            chatHistory: conversationHistory,
            tools:
              disableTools || !shouldUseTools
                ? undefined
                : this.getEnabledTools(),
            toolResults: toolResults.length > 0 ? toolResults : undefined,
            ...generationConfig,
          });

          let functionCalls = null;

          for await (const item of streamResponse) {
            if (this.stopStreamFlag) {
              return responseText;
            }

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
    } finally {
      this.stopStreamFlag = false;
      updateStatus && updateStatus('');
    }
  }

  public async stopResponse(): Promise<void> {
    this.stopStreamFlag = true;
  }
}
