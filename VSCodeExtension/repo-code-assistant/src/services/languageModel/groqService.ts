import * as vscode from 'vscode';

import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageToolCall,
} from 'groq-sdk/src/resources/chat/completions';
import Groq from 'groq-sdk';

import type { GetResponseOptions } from '../../types';
import { AbstractOpenaiLikeService } from './abstractOpenaiLikeService';
import { SettingsManager } from '../../api';

export class GroqService extends AbstractOpenaiLikeService {
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

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

    const conversationHistory = await this.conversationHistoryToContent(
      this.getHistoryBeforeEntry(currentEntryID).entries,
      query,
    );

    let functionCallCount = 0;
    const MAX_FUNCTION_CALLS = 5;

    try {
      if (!sendStreamResponse) {
        while (functionCallCount < MAX_FUNCTION_CALLS) {
          const response = await groq.chat.completions.create({
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
        let responseText: string = '';

        while (functionCallCount < MAX_FUNCTION_CALLS) {
          const streamResponse = await groq.chat.completions.create({
            messages: conversationHistory,
            model: this.currentModel,
            stream: true,
            tools: this.tools,
            ...this.generationConfig,
          } as ChatCompletionCreateParamsStreaming);

          const completeToolCalls: (ChatCompletionMessageToolCall & {
            index: number;
          })[] = [];

          updateStatus && updateStatus('');

          for await (const chunk of streamResponse) {
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

              functionCallCount++;
              break;
            }

            if (!chunk.choices[0]?.delta.tool_calls) {
              const partText = chunk.choices[0]?.delta?.content || '';
              sendStreamResponse(partText);
              responseText += partText;
              continue;
            }

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
        'Failed to get response from Groq Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }
}
