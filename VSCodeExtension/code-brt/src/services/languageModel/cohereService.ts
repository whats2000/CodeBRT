import * as vscode from 'vscode';
import type { Message, Tool, ToolCall } from 'cohere-ai/api';
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

    if (!enabledTools.agentTools?.active && agentTools) {
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
        const response = await model.chat({
          model: selectedModelName ?? this.currentModel,
          message: query,
          chatHistory: conversationHistory,
          tools:
            disableTools || !shouldUseTools
              ? undefined
              : this.getEnabledTools(),
          ...generationConfig,
        });

        if (response.toolCalls && response.toolCalls.length > 0) {
          // Return the tool call for human-in-the-loop approval
          const toolCall = response.toolCalls[0];
          return {
            textResponse: response.text,
            toolCall: {
              id: Date.now().toString(),
              toolName: toolCall.name,
              parameters: toolCall.parameters,
              create_time: Date.now(),
            },
          };
        }

        return { textResponse: response.text };
      } else {
        let responseText = '';

        const streamResponse = await model.chatStream({
          model: selectedModelName ?? this.currentModel,
          message: query,
          chatHistory: conversationHistory,
          tools:
            disableTools || !shouldUseTools
              ? undefined
              : this.getEnabledTools(),
          ...generationConfig,
        });

        let toolCall: ToolCall | null = null;

        for await (const item of streamResponse) {
          if (this.stopStreamFlag) {
            return { textResponse: responseText };
          }

          if (item.eventType === 'text-generation') {
            const partText = item.text;
            sendStreamResponse(partText);
            responseText += partText;
          }

          if (item.eventType === 'tool-calls-generation') {
            toolCall = item.toolCalls?.[0];
            break;
          }
        }

        if (!toolCall) {
          return { textResponse: responseText };
        }

        return {
          textResponse: responseText,
          toolCall: {
            id: Date.now().toString(),
            toolName: toolCall.name,
            parameters: toolCall.parameters,
            create_time: Date.now(),
          },
        };
      }
    } catch (error) {
      return this.handleGetResponseError(error, 'cohere');
    } finally {
      this.stopStreamFlag = false;
    }
  }

  public async stopResponse(): Promise<void> {
    this.stopStreamFlag = true;
  }
}
