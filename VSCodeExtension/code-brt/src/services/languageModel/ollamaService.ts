import fs from 'fs';

import * as vscode from 'vscode';
import type { Message, Options, Tool, ToolCall } from 'ollama';
import { Ollama } from 'ollama';

import type {
  ConversationEntry,
  GetResponseOptions,
  ToolServiceType,
} from '../../types';
import { MODEL_SERVICE_CONSTANTS, toolsSchema } from '../../constants';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import { HistoryManager, SettingsManager } from '../../api';
import { ToolService } from '../tools';

export class OllamaService extends AbstractLanguageModelService {
  private runningModel = '';
  private stopStreamFlag: boolean = false;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    historyManager: HistoryManager,
  ) {
    const availableModelNames = settingsManager.get('ollamaAvailableModels');
    const defaultModelName = settingsManager.get('lastSelectedModel').ollama;

    super(
      'ollama',
      context,
      settingsManager,
      historyManager,
      defaultModelName,
      availableModelNames,
    );
  }

  private getAdvanceSettings(): {
    systemPrompt: string | undefined;
    generationConfig: Partial<Options>;
  } {
    const advanceSettings =
      this.historyManager.getCurrentHistory().advanceSettings;

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
        num_ctx: advanceSettings.maxTokens,
        temperature: advanceSettings.temperature,
        top_p: advanceSettings.topP,
        top_k: advanceSettings.topK,
        presence_penalty: advanceSettings.presencePenalty,
        frequency_penalty: advanceSettings.frequencyPenalty,
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

      tools.push({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      });
    }

    return tools.length > 0 ? tools : undefined;
  }

  private async conversationHistoryToContent(
    entries: {
      [key: string]: ConversationEntry;
    },
    query: string,
    images?: string[],
  ): Promise<Message[]> {
    const result: Message[] = [];
    let currentEntry = entries[this.historyManager.getCurrentHistory().current];

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

    // Ollama's API requires the query message at the end of the history
    if (result.length > 0 && result[result.length - 1].role !== 'user') {
      result.push({
        role: 'user',
        content: query,
      });
    }

    if (images) {
      result[result.length - 1].images = await Promise.all(
        images
          .map(async (imagePath) => {
            try {
              const imageBuffer = await fs.promises.readFile(imagePath);
              return imageBuffer.toString('base64');
            } catch (error) {
              console.error('Failed to read image file:', error);
            }
          })
          .filter((image) => image !== undefined) as Promise<string>[],
      );
    }

    return result;
  }

  private async getRunningModel(): Promise<string> {
    new Ollama({
      host: this.settingsManager.get('ollamaClientHost'),
    })
      .ps()
      .then((response) => {
        if (response.models.length !== 0) {
          const recentlyModifiedModel = response.models.sort((a, b) =>
            a.modified_at > b.modified_at ? -1 : 1,
          )[0].name;
          this.runningModel = recentlyModifiedModel;
          return recentlyModifiedModel;
        }

        // As the ollama service will unload the model after 5 min, we use the last selected model as the running model
        return this.runningModel;
      })
      .catch((error) => {
        vscode.window
          .showErrorMessage(
            'Failed to get running model from Ollama Service: ' +
              error +
              '. Start it and run it? Or download ollama?',
            'Open Terminal',
            'Download Ollama',
          )
          .then((selection) => {
            if (selection === 'Open Terminal') {
              vscode.commands
                .executeCommand('workbench.action.terminal.new')
                .then(() => {
                  vscode.env.clipboard.writeText('ollama run ');
                });
            }
            if (selection === 'Download Ollama') {
              vscode.env.openExternal(
                vscode.Uri.parse('https://ollama.com/download'),
              );
            }
          });
      });

    this.runningModel = '';
    return '';
  }

  private async initModel(
    query: string,
    currentEntryID?: string,
    images?: string[],
  ): Promise<{
    client: Ollama;
    conversationHistory: Message[];
    model: string;
  }> {
    const client = new Ollama({
      host: this.settingsManager.get('ollamaClientHost'),
    });

    const conversationHistory = await this.conversationHistoryToContent(
      this.historyManager.getHistoryBeforeEntry(currentEntryID).entries,
      query,
      images,
    );

    const model =
      this.currentModel === 'Auto Detect'
        ? await this.getRunningModel()
        : this.currentModel;

    return { client, conversationHistory, model };
  }

  private convertContentToToolCall(responseText: string): ToolCall | undefined {
    try {
      // Parse the JSON string to an object
      const parsed = JSON.parse(responseText);

      // Ensure the parsed object has the required structure
      if (parsed && parsed.name && parsed.parameters) {
        return {
          function: {
            name: parsed.name,
            arguments: parsed.parameters,
          },
        };
      } else {
        return {
          function: {
            name: 'Unknown Tool Format',
            arguments: {},
          },
        };
      }
    } catch (error) {
      console.error('Failed to convert content to tool call:', error);
    }
  }

  private handleFunctionCalls = async (
    functionCalls: ToolCall[],
    updateStatus?: (status: string) => void,
  ): Promise<Message[]> => {
    const functionCallResults: Message[] = [];

    for (const functionCall of functionCalls) {
      if (!functionCall.function?.name || !functionCall.function?.arguments) {
        continue;
      }

      const tool = ToolService.getTool(functionCall.function.name);
      if (!tool) {
        functionCallResults.push({
          role: 'tool',
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
          role: 'tool',
          content: result,
        });
      } catch (error) {
        functionCallResults.push({
          role: 'tool',
          content: `Error executing tool ${functionCall.function.name}: ${error}`,
        });
      }
    }

    return functionCallResults;
  };

  public async getLatestAvailableModelNames(): Promise<string[]> {
    const client = new Ollama({
      host: this.settingsManager.get('ollamaClientHost'),
    });

    let newAvailableModelNames: string[] = [...this.availableModelNames];

    try {
      const latestModels = (await client.list()).models.sort((a, b) =>
        a.modified_at > b.modified_at ? -1 : 1,
      );

      // Filter the invalid models (Not existing in the latest models)
      newAvailableModelNames = newAvailableModelNames.filter((name) =>
        latestModels.some((model) => model.name === name),
      );

      // Append the models to the available models if they are not already there
      latestModels.forEach((model) => {
        if (newAvailableModelNames.includes(model.name)) return;

        newAvailableModelNames.push(model.name);
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to fetch available models, make sure the ollama service is running: ' +
          error,
      );
    }

    if (!newAvailableModelNames.includes('Auto Detect')) {
      newAvailableModelNames = ['Auto Detect', ...newAvailableModelNames];
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

    const { query, images, sendStreamResponse, currentEntryID, updateStatus } =
      options;
    const { client, conversationHistory, model } = await this.initModel(
      query,
      currentEntryID,
      images,
    );

    if (model === '') {
      return 'The ollama is seems to be down. Please start the ollama service.';
    }

    let functionCallCount = 0;
    const MAX_FUNCTION_CALLS = 5;
    let functionCallFlag = false;
    let functionCallBuffer = '';
    let isFirstChunk = true;

    const { systemPrompt, generationConfig } = this.getAdvanceSettings();

    if (systemPrompt) {
      conversationHistory.unshift({
        role: 'system',
        content: systemPrompt,
      });
    }

    try {
      if (!sendStreamResponse) {
        while (functionCallCount < MAX_FUNCTION_CALLS) {
          functionCallFlag = false;
          functionCallBuffer = '';

          const response = await client.chat({
            model,
            messages: conversationHistory,
            tools: this.getEnabledTools(),
            options: generationConfig,
          });

          // Check if the first chunk indicates a function call
          if (response.message.content.trim().startsWith('{"name": ')) {
            functionCallFlag = true;
          }

          if (
            functionCallFlag ||
            (response.message.tool_calls &&
              response.message.tool_calls.length > 0)
          ) {
            const toolCall = this.convertContentToToolCall(
              response.message.content,
            );

            if (!toolCall) {
              return response.message.content;
            }

            const functionCallResults = await this.handleFunctionCalls(
              [toolCall],
              updateStatus,
            );
            conversationHistory.push({
              role: 'assistant',
              content: response.message.content,
              tool_calls: [toolCall],
            });
            conversationHistory.push(...functionCallResults);

            functionCallCount++;
          } else {
            return response.message.content;
          }
        }
        return 'Max function call limit reached.';
      } else {
        let responseText = '';

        while (functionCallCount < MAX_FUNCTION_CALLS) {
          if (this.stopStreamFlag) {
            return responseText;
          }

          functionCallFlag = false;
          functionCallBuffer = '';

          const streamResponse = await client.chat({
            model,
            messages: conversationHistory,
            stream: true,
            tools: this.getEnabledTools(),
            options: generationConfig,
          });

          let functionCallResults: Message[] = [];

          for await (const chunk of streamResponse) {
            if (this.stopStreamFlag) {
              return responseText;
            }

            // Check only the first chunk for function call indication
            if (isFirstChunk) {
              isFirstChunk = false;
              if (chunk.message.content.trim().startsWith('{')) {
                functionCallFlag = true;
              }
            }

            if (functionCallFlag) {
              functionCallBuffer += chunk.message.content;
              continue;
            }

            // if (
            //   functionCallFlag ||
            //   (chunk.message.tool_calls && chunk.message.tool_calls.length > 0)
            // ) {
            //   functionCallResults = await this.handleFunctionCalls(
            //     chunk.message.tool_calls || [JSON.parse(chunk.message.content)],
            //     updateStatus,
            //   );
            //
            //   conversationHistory.push({
            //     role: 'assistant',
            //     content: chunk.message.content,
            //     tool_calls: chunk.message.tool_calls,
            //   });
            //   conversationHistory.push(...functionCallResults);
            //   break;
            // }

            const partText = chunk.message.content;
            sendStreamResponse(partText);
            responseText += partText;
          }
          // if (functionCallResults.length === 0) {
          //   return responseText;
          // }

          if (!functionCallFlag) {
            return responseText;
          }

          const toolCall: ToolCall | undefined =
            this.convertContentToToolCall(functionCallBuffer);

          if (!toolCall) {
            return functionCallBuffer;
          }

          functionCallResults = await this.handleFunctionCalls(
            [toolCall],
            updateStatus,
          );

          conversationHistory.push({
            role: 'assistant',
            content: functionCallBuffer,
            tool_calls: [toolCall],
          });

          conversationHistory.push(...functionCallResults);
          functionCallCount++;
        }
        return responseText;
      }
    } catch (error) {
      vscode.window
        .showErrorMessage(
          'Failed to get response from Ollama Service: ' + error,
          'Copy Run Command',
          'Upgrade Ollama',
        )
        .then((selection) => {
          if (selection === 'Copy Run Command') {
            vscode.env.clipboard.writeText(`ollama run ${model}`);
          }
          if (selection === 'Upgrade Ollama') {
            vscode.env.openExternal(
              vscode.Uri.parse(MODEL_SERVICE_CONSTANTS.ollama.apiLink),
            );
          }
        });
      return (
        'Failed to connect to the language model service. ' +
        'Make sure the ollama service is running. Also, check the model has been downloaded.'
      );
    } finally {
      this.stopStreamFlag = false;
      updateStatus && updateStatus('');
    }
  }

  public async stopResponse(): Promise<void> {
    this.stopStreamFlag = true;
  }
}
