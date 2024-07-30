import fs from 'fs';
import path from 'path';

import * as vscode from 'vscode';
import type {
  ChatCompletionContentPartImage,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsBase,
} from 'openai/resources/chat/completions';
import OpenAI from 'openai';

import type { ConversationEntry, GetResponseOptions } from '../../types';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import { SettingsManager } from '../../api';
import { webSearchSchema } from '../../constants';
import { ToolService } from '../tools';

export class OpenAIService extends AbstractLanguageModelService {
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  private readonly generationConfig: Partial<ChatCompletionCreateParamsBase> = {
    temperature: 0.5,
    max_tokens: 1024,
    top_p: 1,
    stop: null,
  };

  private readonly tools: ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: webSearchSchema.name,
        description: webSearchSchema.description,
        parameters: webSearchSchema.inputSchema,
      },
    },
  ];

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get('openaiAvailableModels');
    const defaultModelName = settingsManager.get('lastSelectedModel').openai;

    super(
      'openai',
      context,
      'openAIConversationHistory.json',
      settingsManager,
      defaultModelName,
      availableModelNames,
    );
    this.apiKey = settingsManager.get('openaiApiKey');

    // Initialize and load conversation history
    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize OpenAI Service: ' + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('repo-code-assistant.openaiApiKey')) {
        this.apiKey = settingsManager.get('openaiApiKey');
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistories();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to initialize OpenAI Service History: ' + error,
      );
    }
  }

  private async conversationHistoryToContent(
    entries: { [key: string]: ConversationEntry },
    query: string,
    images?: string[],
  ): Promise<ChatCompletionMessageParam[]> {
    const result: ChatCompletionMessageParam[] = [];
    let currentEntry = entries[this.history.current];

    while (currentEntry) {
      const messageParam: ChatCompletionMessageParam =
        currentEntry.role === 'user'
          ? {
              role: 'user',
              content: [{ type: 'text', text: currentEntry.message }],
            }
          : {
              role: 'assistant',
              content: currentEntry.message,
            };

      result.unshift(messageParam);

      if (currentEntry.parent) {
        currentEntry = entries[currentEntry.parent];
      } else {
        break;
      }
    }

    // OpenAI's API requires the query message at the end of the history
    if (result.length > 0 && result[result.length - 1].role !== 'user') {
      result.push({
        role: 'user',
        content: [{ type: 'text', text: query }],
      });
    }

    if (images && images.length > 0) {
      const imageParts = images
        .map((image) => {
          const mimeType = `image/${path.extname(image).slice(1)}`;
          return this.fileToGenerativePart(image, mimeType);
        })
        .filter(
          (part) => part !== undefined,
        ) as ChatCompletionContentPartImage[];

      result[result.length - 1] = {
        role: 'user',
        content: [{ type: 'text', text: query }, ...imageParts],
      };
    }

    return result;
  }

  private fileToGenerativePart(
    filePath: string,
    mimeType: string,
  ): ChatCompletionContentPartImage | undefined {
    try {
      const base64Data = fs.readFileSync(filePath).toString('base64');
      return {
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${base64Data}`,
        },
      };
    } catch (error) {
      console.error('Failed to read image file:', error);
    }
  }

  private handleFunctionCalls = async (
    functionCalls: ChatCompletionMessageToolCall[],
    updateStatus?: (status: string) => void,
  ): Promise<ChatCompletionToolMessageParam[]> => {
    const functionCallResults: ChatCompletionToolMessageParam[] = [];

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
          role: 'tool',
          tool_call_id: functionCall.id,
          content:
            'Failed to find tool with name: ' + functionCall.function.name,
        });
        continue;
      }

      try {
        const result = await tool({
          ...JSON.parse(functionCall.function.arguments),
          updateStatus,
        });
        functionCallResults.push({
          role: 'tool',
          tool_call_id: functionCall.id,
          content: result,
        });
      } catch (error) {
        functionCallResults.push({
          role: 'tool',
          tool_call_id: functionCall.id,
          content: `Error executing tool ${functionCall.function.name}: ${error}`,
        });
      }
    }

    return functionCallResults;
  };

  public async getLatestAvailableModelNames(): Promise<string[]> {
    const openai = new OpenAI({
      apiKey: this.apiKey,
    });

    let newAvailableModelNames: string[] = [...this.availableModelNames];

    try {
      const latestModels = (await openai.models.list()).data.sort((a, b) =>
        a.created > b.created ? -1 : 1,
      );

      // Filter the invalid models (Not existing in the latest models)
      newAvailableModelNames = newAvailableModelNames.filter((name) =>
        latestModels.some((model) => model.id === name),
      );

      // Append the models to the available models if they are not already there
      latestModels.forEach((model) => {
        if (!model.id) return;
        if (newAvailableModelNames.includes(model.id)) return;
        if (!model.id.includes('gpt')) return;

        newAvailableModelNames.push(model.id);
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

    if (this.currentModel.includes('gpt-3.5') && options.images) {
      vscode.window.showWarningMessage(
        'The images ChatGPT-3.5 is not supported currently. The images will be ignored.',
      );
      options.images = undefined;
    }

    const { query, images, currentEntryID, sendStreamResponse, updateStatus } =
      options;
    const openai = new OpenAI({ apiKey: this.apiKey });

    const conversationHistory = await this.conversationHistoryToContent(
      this.getHistoryBeforeEntry(currentEntryID).entries,
      query,
      images,
    );

    let functionCallCount = 0;
    const MAX_FUNCTION_CALLS = 5;

    try {
      if (!sendStreamResponse) {
        while (functionCallCount < MAX_FUNCTION_CALLS) {
          const response = await openai.chat.completions.create({
            messages: conversationHistory,
            model: this.currentModel,
            tools: this.tools,
            stream: false,
            ...this.generationConfig,
          } as ChatCompletionCreateParamsNonStreaming);

          if (!response.choices[0]?.message.tool_calls) {
            return response.choices[0]?.message?.content!;
          }

          const functionCallResults = await this.handleFunctionCalls(
            response.choices[0].message.tool_calls,
          );

          conversationHistory.push({
            role: 'assistant',
            content: null,
            tool_calls: response.choices[0].message.tool_calls,
          });
          conversationHistory.push(...functionCallResults);

          functionCallCount++;
        }
        return 'Max function call limit reached.';
      } else {
        let responseText = '';

        while (functionCallCount < MAX_FUNCTION_CALLS) {
          const streamResponse = await openai.chat.completions.create({
            model: this.currentModel,
            messages: conversationHistory,
            tools: this.tools,
            stream: true,
            ...this.generationConfig,
          } as ChatCompletionCreateParamsStreaming);

          const completeToolCalls: (ChatCompletionMessageToolCall & {
            index: number;
          })[] = [];

          updateStatus && updateStatus('');

          for await (const chunk of streamResponse) {
            if (chunk.choices[0]?.finish_reason === 'tool_calls') {
              const toolCalls = completeToolCalls.map((call) => ({
                id: call.id,
                function: call.function,
                type: call.type,
              }));
              const functionCallResults = await this.handleFunctionCalls(
                toolCalls,
                updateStatus,
              );

              conversationHistory.push({
                role: 'assistant',
                content: null,
                tool_calls: toolCalls,
              });
              conversationHistory.push(...functionCallResults);

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
            chunk.choices[0].delta.tool_calls.forEach((deltaToolCall) => {
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
        return responseText;
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from OpenAI Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }
}
