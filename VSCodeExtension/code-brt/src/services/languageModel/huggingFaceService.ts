import * as vscode from 'vscode';
import {
  ChatCompletionInput,
  ChatCompletionInputMessage,
  ChatCompletionInputTool,
  ChatCompletionOutputToolCall,
} from '@huggingface/tasks/src/tasks/chat-completion/inference';
import { HfInference } from '@huggingface/inference';

import type {
  ConversationEntry,
  GetResponseOptions,
  NonWorkspaceToolType,
  ResponseWithAction,
} from '../../types';
import { AbstractLanguageModelService } from './base';
import { HistoryManager, SettingsManager } from '../../api';
import { ToolServiceProvider } from '../tools';

export class HuggingFaceService extends AbstractLanguageModelService {
  private stopStreamFlag: boolean = false;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get(
      'huggingFaceAvailableModels',
    );
    const defaultModelName =
      settingsManager.get('lastSelectedModel').huggingFace;

    super(
      'huggingFace',
      context,
      settingsManager,
      defaultModelName,
      availableModelNames,
    );
  }

  private getAdvanceSettings(historyManager: HistoryManager): {
    systemPrompt: string | undefined;
    generationConfig: Partial<ChatCompletionInput>;
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
        max_tokens: advanceSettings.maxTokens,
        temperature: advanceSettings.temperature,
        top_p: advanceSettings.topP,
        presence_penalty: advanceSettings.presencePenalty,
        frequency_penalty: advanceSettings.frequencyPenalty,
      },
    };
  }

  private getEnabledTools(): ChatCompletionInputTool[] | undefined {
    const enabledTools = this.settingsManager.get('enableTools');
    const tools: ChatCompletionInputTool[] = [];
    const { agentTools, ...toolsSchema } = ToolServiceProvider.getToolSchema();

    if (enabledTools.agentTools?.active && agentTools) {
      for (const [_key, tool] of Object.entries(agentTools)) {
        tools.push({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            arguments: tool.inputSchema,
          },
        });
      }
    }

    for (const [key, tool] of Object.entries(toolsSchema)) {
      if (!enabledTools[key as NonWorkspaceToolType]?.active) {
        continue;
      }

      tools.push({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          arguments: tool.inputSchema,
        },
      });
    }

    return tools.length > 0 ? tools : undefined;
  }

  private conversationHistoryToContent(
    entries: { [key: string]: ConversationEntry },
    query: string,
    historyManager: HistoryManager,
  ): ChatCompletionInputMessage[] {
    const result: ChatCompletionInputMessage[] = [];
    let currentEntry = entries[historyManager.getCurrentHistory().current];

    while (currentEntry) {
      result.unshift({
        role: currentEntry.role === 'user' ? 'user' : 'assistant',
        content: currentEntry.message,
      });

      if (currentEntry.parent) {
        currentEntry = entries[currentEntry.parent];
      } else {
        break;
      }
    }

    // Hugging Face's API requires the query message at the end of the history
    if (result[result.length - 1]?.role !== 'user') {
      result.push({
        role: 'user',
        content: query,
      });
    }

    return result;
  }

  protected tryParseToolCall(
    completeToolCallsString: string,
  ): ChatCompletionOutputToolCall[] | undefined {
    try {
      // Example Tool Calls String:
      /**
       * {  "function": {
       *   "_name": "searchWeb",
       *   "query": "recent news"
       * }}<|eot_id|>
       */

      // Remove the "<|eot_id|>" string from the tool calls string and replace the "_name" key with "name"
      const correctToolCallsString = completeToolCallsString
        .replace('<|eot_id|>', '')
        .replace(/"_name"/g, '"name"');

      const toolCallObject = JSON.parse(correctToolCallsString);

      // Convert the JSON object to the correct format
      const correctToolCalls: ChatCompletionOutputToolCall[] = [];

      // Function to format a single tool call object
      const formatToolCall = (
        toolCall: any,
        id: string,
      ): ChatCompletionOutputToolCall | undefined => {
        if (!toolCall.function?.name) {
          return undefined;
        }
        const { name, ...args } = toolCall.function;
        return {
          id: id,
          type: 'function',
          function: {
            name: name,
            arguments: args,
          },
        };
      };

      // Check if the parsed object is an array or a single object
      if (Array.isArray(toolCallObject)) {
        toolCallObject.forEach((toolCall, index) => {
          const toolCallResult = formatToolCall(toolCall, index.toString());
          if (toolCallResult) {
            correctToolCalls.push(toolCallResult);
          }
        });
      } else {
        const toolCallResult = formatToolCall(toolCallObject, '0');
        if (toolCallResult) {
          correctToolCalls.push(toolCallResult);
        }
      }

      return correctToolCalls.length > 0 ? correctToolCalls : undefined;
    } catch (error) {
      console.error('Failed to parse tool call arguments:', error);
      return undefined;
    }
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

    const huggerFace = new HfInference(
      this.settingsManager.get('huggingFaceApiKey'),
    );

    const conversationHistory = this.conversationHistoryToContent(
      historyManager.getHistoryBeforeEntry(currentEntryID).entries,
      query,
      historyManager,
    );

    const { systemPrompt, generationConfig } =
      this.getAdvanceSettings(historyManager);

    if (systemPrompt) {
      conversationHistory.unshift({
        role: 'system',
        content: systemPrompt,
      });
    }

    const MAX_RETRIES = 5;
    let retryCount = 0;
    let responseText = '';
    updateStatus && updateStatus('');
    try {
      while (retryCount < MAX_RETRIES) {
        if (!sendStreamResponse) {
          // The non-streaming response is not supported tool calls in this version
          if (!disableTools) {
            vscode.window.showWarningMessage(
              'The non-streaming response is not supported tool calls in this version. The tool calls will be ignored.',
            );
          }

          const response = await huggerFace.chatCompletion({
            messages: conversationHistory,
            model: selectedModelName ?? this.currentModel,
            ...generationConfig,
            stream: false,
          });

          responseText = response.choices[0]?.message?.content || '';

          return {
            textResponse: responseText,
            toolCall: undefined,
          };
        } else {
          // TODO:
          //  Current have some issues with the Hugging Face API
          //  so the tool calls are not being returned correctly format
          const streamResponse = huggerFace.chatCompletionStream({
            messages: conversationHistory,
            model: selectedModelName ?? this.currentModel,
            tools: disableTools ? undefined : this.getEnabledTools(),
            ...generationConfig,
            stream: true,
          });

          let completeToolCallsString: string = '';

          for await (const chunk of streamResponse) {
            if (this.stopStreamFlag) {
              return { textResponse: responseText };
            }

            if (!chunk.choices[0]?.delta.tool_calls) {
              const partText = chunk.choices[0]?.delta?.content || '';
              sendStreamResponse(partText);
              responseText += partText;
              continue;
            }

            // Collect tool calls delta from the stream response delta
            updateStatus &&
              updateStatus(`[processing] I'm creating an action...`);
            completeToolCallsString +=
              chunk.choices[0]?.delta.tool_calls.function.arguments;
          }

          if (completeToolCallsString.length === 0) {
            return { textResponse: responseText };
          }

          const correctToolCall = this.tryParseToolCall(
            completeToolCallsString,
          )?.[0];

          let validation = {
            isValid: false,
            feedback:
              'The tool call seems to be invalid. Please check the tool call schema and try again.',
          };

          if (correctToolCall) {
            const toolCall = {
              id: correctToolCall.id,
              toolName: correctToolCall.function.name,
              parameters: correctToolCall.function.arguments as Record<
                string,
                any
              >,
              create_time: Date.now(),
            };
            validation = ToolServiceProvider.isViableToolCall(toolCall);
            // Return the response if the tool call is valid
            if (validation.isValid) {
              return {
                textResponse: responseText,
                toolCall,
              };
            }
          }

          // Otherwise, add the tool call feedback to the conversation history and retry
          conversationHistory.push({
            role: 'assistant',
            content: completeToolCallsString,
          });
          conversationHistory.push({
            role: 'user',
            content: validation.feedback,
          });
          retryCount++;
        }
      }
      return { textResponse: responseText };
    } catch (error) {
      return this.handleGetResponseError(error, 'huggingFace');
    } finally {
      this.stopStreamFlag = false;
      updateStatus && updateStatus('');
    }
  }

  public async stopResponse(): Promise<void> {
    this.stopStreamFlag = true;
  }
}
