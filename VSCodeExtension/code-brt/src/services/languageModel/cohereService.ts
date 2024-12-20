import * as vscode from 'vscode';
import type { Message, Tool, ToolCall, ToolResult } from 'cohere-ai/api';
import { CohereClient } from 'cohere-ai';

import type {
  ConversationEntry,
  GetResponseOptions,
  NonWorkspaceToolType,
  ResponseWithAction,
  ToolSchema,
} from '../../types';
import { mapTypeToPythonFormat } from './utils';
import { AbstractLanguageModelService } from './base';
import { HistoryManager, SettingsManager } from '../../api';
import { ToolServiceProvider } from '../tools';
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
        stopSequences: advanceSettings.stop,
      },
    };
  }

  private getEnabledTools(): Tool[] | undefined {
    const enabledTools = this.settingsManager.get('enableTools');
    const tools: Tool[] = [];

    const { agentTools, ...toolsSchema } = ToolServiceProvider.getToolSchema();

    const addTool = (tool: ToolSchema) => {
      tools.push({
        name: tool.name,
        description: tool.description,
        parameterDefinitions: Object.keys(tool.inputSchema.properties).reduce(
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
        ),
      });
    };

    if (enabledTools.agentTools?.active && agentTools) {
      for (const [_key, tool] of Object.entries(agentTools)) {
        addTool(tool);
      }
    }

    for (const [key, tool] of Object.entries(toolsSchema)) {
      if (!enabledTools[key as NonWorkspaceToolType]?.active) {
        continue;
      }
      addTool(tool);
    }

    return tools.length > 0 ? tools : undefined;
  }

  private convertToolCallResponse(
    toolCallResponseEntry: ConversationEntry,
    entries: {
      [key: string]: ConversationEntry;
    },
  ): ToolResult {
    const toolCallResponse = toolCallResponseEntry.toolResponses?.[0];

    if (!toolCallResponse || !toolCallResponseEntry.parent) {
      throw new Error('Invalid tool call response entry');
    }

    const toolCallEntry = entries[toolCallResponseEntry.parent];
    const toolCall = toolCallEntry.toolCalls?.[0];

    if (!toolCall) {
      throw new Error('Cannot find the corresponding tool call');
    }

    return {
      call: {
        name: toolCall.toolName,
        parameters: toolCall.parameters,
      },
      outputs: [
        {
          error: toolCallResponse.status !== 'success',
          result: toolCallResponse.result,
        },
      ],
    };
  }

  private conversationHistoryToContent(
    entries: {
      [key: string]: ConversationEntry;
    },
    historyManager: HistoryManager,
    currentEntryID?: string,
  ): { conversationHistory: Message[]; toolResults: ToolResult[] } {
    let result: Message[] = [];
    let currentEntry =
      entries[currentEntryID ?? historyManager.getCurrentHistory().current];

    while (currentEntry) {
      switch (currentEntry.role) {
        case 'AI':
          const newEntry: Message = {
            role: 'CHATBOT',
            message: currentEntry.message,
          };
          const toolCall = currentEntry.toolCalls?.[0];
          if (toolCall) {
            newEntry.toolCalls = [
              {
                name: toolCall.toolName,
                parameters: toolCall.parameters,
              },
            ];
          }
          result.unshift(newEntry);
          break;
        case 'user':
          result.unshift({
            role: 'USER',
            message: currentEntry.message,
          });
          break;
        case 'tool':
          result.unshift({
            role: 'TOOL',
            toolResults: [this.convertToolCallResponse(currentEntry, entries)],
          });
          break;
      }

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
    if (result.length > 0 && result[result.length - 1].role === 'TOOL') {
      const lastToolResult = result.pop() as Message.Tool;
      return {
        conversationHistory: result,
        toolResults: lastToolResult.toolResults ?? [],
      };
    }

    return {
      conversationHistory: result,
      toolResults: [],
    };
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

  public async getResponse(
    options: GetResponseOptions,
  ): Promise<ResponseWithAction> {
    if (this.currentModel === '') {
      vscode.window.showErrorMessage(
        'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
      );
      return {
        textResponse:
          'Missing model configuration. Check the model selection dropdown.',
      };
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

    let { conversationHistory, toolResults } =
      this.conversationHistoryToContent(
        historyManager.getHistoryBeforeEntry(currentEntryID).entries,
        historyManager,
        currentEntryID,
      );

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

    const MAX_RETRIES = 5;
    let retryCount = 0;
    let responseText = '';
    let responseToolCall: ToolCall | undefined = undefined;

    updateStatus && updateStatus('');

    try {
      while (retryCount < MAX_RETRIES) {
        responseToolCall = undefined;

        const requestPayload: ChatRequest = {
          model: selectedModelName ?? this.currentModel,
          message: toolResults.length > 0 ? '' : query,
          chatHistory: conversationHistory,
          toolResults: toolResults.length > 0 ? toolResults : undefined,
          tools:
            disableTools || !shouldUseTools
              ? undefined
              : this.getEnabledTools(),
          ...generationConfig,
        };
        if (!sendStreamResponse) {
          const response = await model.chat(requestPayload);
          responseText = response.text;
          responseToolCall = response.toolCalls?.[0];
        } else {
          const streamResponse = await model.chatStream(requestPayload);

          for await (const item of streamResponse) {
            if (this.stopStreamFlag) {
              return { textResponse: responseText };
            }

            if (item.eventType === 'text-generation') {
              const partText = item.text;
              sendStreamResponse(partText);
              responseText += partText;
            } else if (item.eventType === 'tool-calls-generation') {
              updateStatus &&
                updateStatus(`[processing] I'm creating an action...`);
              responseToolCall = item.toolCalls?.[0];
              break;
            }
          }
        }

        if (!responseToolCall) {
          return { textResponse: responseText };
        }

        const toolCall = {
          id: Date.now().toString(),
          toolName: responseToolCall.name,
          parameters: responseToolCall.parameters,
          create_time: Date.now(),
        };

        const validation = ToolServiceProvider.isViableToolCall(toolCall);
        // Return the response if the tool call is valid
        if (validation.isValid) {
          return {
            textResponse: responseText,
            toolCall,
          };
        }

        // Otherwise, add the tool call feedback to the conversation history and retry
        conversationHistory.push({
          role: 'USER',
          message: query,
        });

        conversationHistory.push({
          role: 'CHATBOT',
          message: '',
          toolCalls: [responseToolCall],
        });

        toolResults = [
          {
            call: responseToolCall,
            outputs: [
              {
                error: true,
                feedback: validation.feedback,
              },
            ],
          },
        ];
        retryCount++;
      }
      return { textResponse: responseText };
    } catch (error) {
      return this.handleGetResponseError(error, 'cohere', responseText);
    } finally {
      this.stopStreamFlag = false;
      updateStatus && updateStatus('');
    }
  }

  public async stopResponse(): Promise<void> {
    this.stopStreamFlag = true;
  }
}
