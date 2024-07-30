import * as vscode from 'vscode';
import type {
  ChatCompletionCreateParamsBase,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionChunk,
} from 'groq-sdk/src/resources/chat/completions';
import Groq from 'groq-sdk';

import type { ConversationEntry, GetResponseOptions } from '../../types';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import { SettingsManager } from '../../api';
import { webSearchSchema } from '../../constants';
import { ToolService } from '../tools';

export class GroqService extends AbstractLanguageModelService {
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;
  private readonly generationConfig: Partial<ChatCompletionCreateParamsBase> = {
    temperature: 0.5,
    max_tokens: 1024,
    top_p: 1,
    stop: null,
  };

  private tools: ChatCompletionTool[] = [
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
    const availableModelNames = settingsManager.get('groqAvailableModels');
    const defaultModelName = settingsManager.get('lastSelectedModel').groq;

    super(
      'groq',
      context,
      'groqConversationHistory.json',
      settingsManager,
      defaultModelName,
      availableModelNames,
    );

    this.apiKey = settingsManager.get('groqApiKey');

    // Initialize and load conversation history
    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize Groq Service History: ' + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('repo-code-assistant.groqApiKey')) {
        this.apiKey = settingsManager.get('groqApiKey');
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistories();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to initialize Groq Service: ' + error,
      );
    }
  }

  private conversationHistoryToContent(
    entries: { [key: string]: ConversationEntry },
    query: string,
  ): ChatCompletionMessageParam[] {
    const result: ChatCompletionMessageParam[] = [];
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

    // Groq's API requires the query message at the end of the history
    if (result.length > 0 && result[result.length - 1].role !== 'user') {
      result.push({
        role: 'user',
        content: query,
      });
    }

    return result;
  }

  private handleFunctionCalls = async (
    functionCalls:
      | ChatCompletionMessageToolCall[]
      | ChatCompletionChunk.Choice.Delta.ToolCall[],
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
    const groq = new Groq({
      apiKey: this.apiKey,
    });

    let newAvailableModelNames: string[] = [...this.availableModelNames];

    try {
      const latestModels = (await groq.models.list()).data.sort((a, b) =>
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
        if (model.id.includes('whisper')) return;

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
      vscode.window
        .showErrorMessage(
          'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
        )
        .then();
      return 'Missing model configuration. Check the model selection dropdown.';
    }

    const { query, images, currentEntryID, sendStreamResponse, updateStatus } =
      options;

    if (images && images.length > 0) {
      vscode.window.showWarningMessage(
        'The images inference is not supported currently. The images will be ignored.',
      );
    }

    const groq = new Groq({
      apiKey: this.apiKey,
    });

    const conversationHistory = this.conversationHistoryToContent(
      this.getHistoryBeforeEntry(currentEntryID).entries,
      query,
    );

    try {
      if (!sendStreamResponse) {
        const result = await groq.chat.completions.create({
          messages: conversationHistory,
          model: this.currentModel,
          tools: this.tools,
          ...this.generationConfig,
        } as ChatCompletionCreateParamsNonStreaming);

        if (result.choices[0]?.message?.tool_calls) {
          const functionCallResults = await this.handleFunctionCalls(
            result.choices[0].message.tool_calls,
          );

          conversationHistory.push({
            role: 'assistant',
            content: null,
            tool_calls: result.choices[0].message.tool_calls,
          });

          conversationHistory.push(...functionCallResults);
        }
        return (
          await groq.chat.completions.create({
            messages: conversationHistory,
            model: this.currentModel,
            stream: false,
            ...this.generationConfig,
          } as ChatCompletionCreateParamsNonStreaming)
        ).choices[0]?.message?.content!;
      }

      const stream = await groq.chat.completions.create({
        messages: conversationHistory,
        model: this.currentModel,
        stream: true,
        tools: this.tools,
        ...this.generationConfig,
      } as ChatCompletionCreateParamsStreaming);

      let responseText: string = '';
      const completeToolCalls: (ChatCompletionMessageToolCall & {
        index: number;
      })[] = [];
      for await (const chunk of stream) {
        if (chunk.choices[0]?.finish_reason === 'tool_calls') {
          const functionCallResults = await this.handleFunctionCalls(
            completeToolCalls,
            updateStatus,
          );

          conversationHistory.push({
            role: 'assistant',
            content: null,
            tool_calls: completeToolCalls,
          });

          conversationHistory.push(...functionCallResults);

          const newStream = await groq.chat.completions.create({
            messages: conversationHistory,
            model: this.currentModel,
            tools: this.tools,
            stream: true,
            ...this.generationConfig,
          } as ChatCompletionCreateParamsStreaming);

          updateStatus && updateStatus('');

          for await (const newChunk of newStream) {
            const partText = newChunk.choices[0]?.delta?.content || '';
            sendStreamResponse(partText);
            responseText += partText;
          }

          return responseText;
        }
        if (chunk.choices[0]?.delta.tool_calls) {
          const deltaToolCalls = chunk.choices[0].delta.tool_calls;

          deltaToolCalls.forEach((deltaToolCall) => {
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
        } else {
          const partText = chunk.choices[0]?.delta?.content || '';
          sendStreamResponse(partText);
          responseText += partText;
        }
      }

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Groq Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }
}
