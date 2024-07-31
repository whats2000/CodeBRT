import * as vscode from 'vscode';
import type {
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageToolCall,
  ChatCompletionCreateParamsNonStreaming,
} from 'openai/resources/chat/completions';
import OpenAI from 'openai';

import type { GetResponseOptions } from '../../types';
import { SettingsManager } from '../../api';
import { AbstractOpenaiLikeService } from './abstractOpenaiLikeService';
import { MODEL_SERVICE_LINKS } from '../../constants';

export class OpenAIService extends AbstractOpenaiLikeService {
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

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
          functionCallCount++;
        }
        return responseText;
      }
    } catch (error) {
      vscode.window
        .showErrorMessage(
          'Failed to get response from OpenAI Service: ' + error,
          'Get API Key',
        )
        .then((selection) => {
          if (selection === 'Get API Key') {
            vscode.env.openExternal(
              vscode.Uri.parse(MODEL_SERVICE_LINKS.openaiApiKey as string),
            );
          }
        });
      return 'Failed to connect to the language model service.';
    }
  }
}
