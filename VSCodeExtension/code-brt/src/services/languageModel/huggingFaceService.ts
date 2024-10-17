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
  ToolServiceType,
} from '../../types';
import { AbstractLanguageModelService } from './base';
import { HistoryManager, SettingsManager } from '../../api';
import { MODEL_SERVICE_CONSTANTS, toolsSchema } from '../../constants';
import { ToolService } from '../tools';

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

    for (const [key, tool] of Object.entries(toolsSchema)) {
      if (!enabledTools[key as ToolServiceType].active) {
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

  protected handleFunctionCalls = async (
    functionCalls: ChatCompletionOutputToolCall[],
    updateStatus?: (status: string) => void,
  ): Promise<{
    success: boolean;
    functionCallResults: string;
  }> => {
    let functionCallResults: string = '';
    let success = true;

    for (const functionCall of functionCalls) {
      if (!functionCall.function?.name || !functionCall.function?.arguments) {
        continue;
      }

      const tool = ToolService.getTool(functionCall.function.name);
      if (!tool) {
        functionCallResults += `Failed to find tool with name: ${functionCall.function.name}. \n\n The tool available are: \n${JSON.stringify(
          this.getEnabledTools(),
          null,
          2,
        )}`;
        success = false;
        continue;
      }

      try {
        const result = await tool({
          ...functionCall.function.arguments,
          updateStatus,
        } as any);
        functionCallResults += result;
      } catch (error) {
        functionCallResults += `Failed to execute tool with name: ${functionCall.function.name}. \n\n Error: ${error}`;
        success = false;
      }
    }

    return {
      success,
      functionCallResults,
    };
  };

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

    const huggerFace = new HfInference(
      this.settingsManager.get('huggingFaceApiKey'),
    );

    const conversationHistory = this.conversationHistoryToContent(
      historyManager.getHistoryBeforeEntry(currentEntryID).entries,
      query,
      historyManager,
    );

    let functionCallCount = 0;
    const MAX_FUNCTION_CALLS = 5;

    const { systemPrompt, generationConfig } =
      this.getAdvanceSettings(historyManager);

    if (systemPrompt) {
      conversationHistory.unshift({
        role: 'system',
        content: systemPrompt,
      });
    }

    try {
      if (!sendStreamResponse) {
        if (!disableTools) {
          vscode.window.showWarningMessage(
            'The non-streaming response is not supported tool calls in this version. The tool calls will be ignored.',
          );
        }

        return (
          await huggerFace.chatCompletion({
            messages: conversationHistory,
            model: selectedModelName ?? this.currentModel,
            stream: false,
            ...generationConfig,
          })
        ).choices[0]?.message?.content!;

        // TODO: The following code is not working correctly due to the Hugging Face API not returning the tool calls correctly
        // Update it after the API is fixed
        /**
        while (functionCallCount < MAX_FUNCTION_CALLS) {
          const response = await huggerFace.chatCompletion({
            messages: conversationHistory,
            model: this.currentModel,
            tools: this.tools,
            stream: false,
            ...this.generationConfig,
          });

          if (!response.choices[0]?.message.tool_calls) {
            return response.choices[0]?.message?.content!;
          }

          const { functionCallResults } = await this.handleFunctionCalls(
            response.choices[0].message.tool_calls,
          );

          conversationHistory.push({
            role: 'assistant',
            tool_calls: response.choices[0].message.tool_calls,
          });

          conversationHistory.push({
            role: 'user',
            tool_calls: functionCallResults,
          });

          functionCallCount++;
        }
        return 'Max function call limit reached.';
        **/
      } else {
        let responseText = '';

        // TODO: Current have some issues with the Hugging Face API so the tool calls are not being returned correctly format
        let functionCallSuccess = false;

        while (functionCallCount < MAX_FUNCTION_CALLS) {
          if (this.stopStreamFlag) {
            return responseText;
          }

          const streamResponse = huggerFace.chatCompletionStream({
            messages: conversationHistory,
            model: selectedModelName ?? this.currentModel,
            tools:
              functionCallSuccess || disableTools
                ? undefined
                : this.getEnabledTools(),
            stream: true,
            ...generationConfig,
          });

          let completeToolCallsString: string = '';
          let isClearStatus = false;

          for await (const chunk of streamResponse) {
            if (this.stopStreamFlag) {
              return responseText;
            }

            updateStatus && isClearStatus && updateStatus('');
            isClearStatus = true;

            if (!chunk.choices[0]?.delta.tool_calls) {
              const partText = chunk.choices[0]?.delta?.content || '';
              sendStreamResponse(partText);
              responseText += partText;
              continue;
            }

            // Collect tool calls delta from the stream response delta
            completeToolCallsString +=
              chunk.choices[0]?.delta.tool_calls.function.arguments;
          }

          if (completeToolCallsString.length === 0) {
            return responseText;
          }

          // Example Tool Calls String:
          /**
           * {  "function": {
           *   "_name": "searchWeb",
           *   "query": "recent news"
           * }}<|eot_id|>
           */

          // Remove the "<|eot_id|>" string from the tool calls string
          completeToolCallsString = completeToolCallsString.replace(
            '<|eot_id|>',
            '',
          );

          // Replace the "_name" key with "name" key
          completeToolCallsString = completeToolCallsString.replace(
            /"_name"/g,
            '"name"',
          );

          // Parse the string into a JSON object
          let toolCallObject = JSON.parse(completeToolCallsString);

          // Convert the JSON object to the correct format
          const correctToolCalls: ChatCompletionOutputToolCall[] = [];

          // Function to format a single tool call object
          const formatToolCall = (
            toolCall: any,
            id: string,
          ): ChatCompletionOutputToolCall => {
            if (!toolCall.function?.name) {
              return {
                id: id,
                type: 'function',
                function: {
                  name: 'missing "name" key',
                  arguments: {},
                },
              };
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
              correctToolCalls.push(formatToolCall(toolCall, index.toString()));
            });
          } else {
            correctToolCalls.push(formatToolCall(toolCallObject, '0'));
          }

          // Handle the tool calls
          const { success, functionCallResults } =
            await this.handleFunctionCalls(correctToolCalls, updateStatus);

          functionCallSuccess = success;

          conversationHistory[conversationHistory.length - 1].content =
            query +
            '\n The Tool Results are as follows: \n' +
            functionCallResults;

          functionCallCount++;
        }
        return 'Max function call limit reached.';
      }
    } catch (error) {
      vscode.window
        .showErrorMessage(
          'Failed to get response from Hugging Face Service: ' + error,
          'Get Access Token',
        )
        .then((selection) => {
          if (selection === 'Get Access Token') {
            vscode.env.openExternal(
              vscode.Uri.parse(MODEL_SERVICE_CONSTANTS.huggingFace.apiLink),
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
