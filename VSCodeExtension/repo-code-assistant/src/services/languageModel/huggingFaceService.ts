import * as vscode from 'vscode';
import {
  ChatCompletionInput,
  ChatCompletionInputMessage,
  ChatCompletionInputTool,
  ChatCompletionInputToolCall,
  ChatCompletionOutputToolCall,
} from '@huggingface/tasks/src/tasks/chat-completion/inference';
import { HfInference } from '@huggingface/inference';

import type { ConversationEntry, GetResponseOptions } from '../../types';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import { SettingsManager } from '../../api';
import { MODEL_SERVICE_LINKS, webSearchSchema } from '../../constants';
import { ToolService } from '../tools';

export class HuggingFaceService extends AbstractLanguageModelService {
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  private readonly generationConfig: Partial<ChatCompletionInput> = {
    max_tokens: 8192,
  };

  private readonly tools: ChatCompletionInputTool[] = [
    {
      type: 'function',
      function: {
        name: webSearchSchema.name,
        description: webSearchSchema.description,
        arguments: webSearchSchema.inputSchema,
      },
    },
  ];

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
      'huggingFaceConversationHistory.json',
      settingsManager,
      defaultModelName,
      availableModelNames,
    );

    this.apiKey = settingsManager.get('huggingFaceApiKey');

    // Initialize and load conversation history
    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize Hugging Face Service: ' + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('repo-code-assistant.huggingFaceApiKey')) {
        this.apiKey = settingsManager.get('huggingFaceApiKey');
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistories();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to initialize Hugging Face Service: ' + error,
      );
    }
  }

  private conversationHistoryToContent(
    entries: { [key: string]: ConversationEntry },
    query: string,
  ): ChatCompletionInputMessage[] {
    const result: ChatCompletionInputMessage[] = [];
    let currentEntry = entries[this.history.current];

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
    if (result.length > 0 && result[result.length - 1].role !== 'user') {
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
  ): Promise<ChatCompletionInputToolCall[]> => {
    const functionCallResults: ChatCompletionInputToolCall[] = [];

    for (const functionCall of functionCalls) {
      if (
        !functionCall.function?.name ||
        !functionCall.id ||
        !functionCall.function?.arguments
      ) {
        continue;
      }

      const tool = ToolService.getTool(functionCall.function.name);
      if (!tool) {
        functionCallResults.push({
          id: functionCall.id,
          type: 'function',
          function: functionCall.function,
          content:
            'Failed to find tool with name: ' + functionCall.function.name,
        });
        continue;
      }

      try {
        const result = await tool({
          ...functionCall.function.arguments,
          updateStatus,
        } as any);
        functionCallResults.push({
          id: functionCall.id,
          type: 'function',
          function: functionCall.function,
          content: result,
        });
      } catch (error) {
        functionCallResults.push({
          id: functionCall.id,
          type: 'function',
          function: functionCall.function,
          content: `Error executing tool ${functionCall.function.name}: ${error}`,
        });
      }
    }

    return functionCallResults;
  };

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

    const huggerFace = new HfInference(this.apiKey);

    const conversationHistory = this.conversationHistoryToContent(
      this.getHistoryBeforeEntry(currentEntryID).entries,
      query,
    );

    let functionCallCount = 0;
    const MAX_FUNCTION_CALLS = 5;

    try {
      if (!sendStreamResponse) {
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

          const functionCallResults = await this.handleFunctionCalls(
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
      } else {
        let responseText = '';

        while (functionCallCount < MAX_FUNCTION_CALLS) {
          const streamResponse = huggerFace.chatCompletionStream({
            messages: conversationHistory,
            model: this.currentModel,
            tools: this.tools,
            stream: true,
            ...this.generationConfig,
          });

          // TODO: Review this part after the Hugging Face API is updated as the id type is seems to be string instead of number
          const completeToolCalls: {
            id: string;
            index: ChatCompletionInputToolCall['index'];
            function: ChatCompletionInputToolCall['function'];
            type: ChatCompletionInputToolCall['type'];
            [p: string]: unknown;
          }[] = [];

          for await (const chunk of streamResponse) {
            if (chunk.choices[0]?.finish_reason === 'tool_calls') {
              const toolCalls = completeToolCalls.map((call) => ({
                id: call.id,
                function: call.function,
                type: call.type,
              }));
              const functionCallResults = await this.handleFunctionCalls(
                // TODO: Review this part after the Hugging Face API is updated
                toolCalls as unknown as ChatCompletionOutputToolCall[],
                updateStatus,
              );

              conversationHistory.push({
                role: 'assistant',
                tool_calls:
                  // TODO: Review this part after the Hugging Face API is updated
                  completeToolCalls as unknown as ChatCompletionInputToolCall[],
              });
              conversationHistory.push({
                role: 'user',
                tool_calls: functionCallResults,
              });

              functionCallCount++;
              break;
            }

            if (!chunk.choices[0]?.delta.tool_calls) {
              const partText = chunk.choices[0]?.delta?.content || '';
              sendStreamResponse(partText);
              responseText += partText;
              continue;
            }

            // Collect tool calls delta from the stream response delta
            // TODO: Review this part after the Hugging Face API is updated as `chunk.choices[0].delta.tool_calls` seems to be array instead of object
            [chunk.choices[0].delta.tool_calls].forEach((deltaToolCall) => {
              const index = deltaToolCall.index;
              let existingToolCall = completeToolCalls.find(
                (call) => call.index === index,
              );

              if (!existingToolCall) {
                existingToolCall = {
                  id: '',
                  function: { name: '', arguments: '' },
                  type: 'function',
                  index: index,
                };
                completeToolCalls.push(existingToolCall);
              }

              existingToolCall.id += deltaToolCall.id || '';
              existingToolCall.function.name =
                deltaToolCall.function?.name || existingToolCall.function.name;
              existingToolCall.function.arguments +=
                deltaToolCall.function?.arguments || '';
            });
          }
          if (completeToolCalls.length === 0) {
            return responseText;
          }
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
              vscode.Uri.parse(MODEL_SERVICE_LINKS.huggingFaceApiKey as string),
            );
          }
        });
      return 'Failed to connect to the language model service.';
    }
  }
}
