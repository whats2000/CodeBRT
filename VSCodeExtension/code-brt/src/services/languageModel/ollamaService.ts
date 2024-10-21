import fs from 'fs';

import * as vscode from 'vscode';
import type { ChatRequest, Message, Options, Tool, ToolCall } from 'ollama';
import { Ollama } from 'ollama';

import type {
  ConversationEntry,
  GetResponseOptions,
  NonWorkspaceToolType,
  ResponseWithAction,
} from '../../types';
import { MODEL_SERVICE_CONSTANTS } from '../../constants';
import { ParseToolCallUtils } from './utils';
import { AbstractLanguageModelService } from './base';
import { HistoryManager, SettingsManager } from '../../api';
import { ToolServiceProvider } from '../tools';

export class OllamaService extends AbstractLanguageModelService {
  private runningModel = '';
  private stopStreamFlag: boolean = false;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get('ollamaAvailableModels');
    const defaultModelName = settingsManager.get('lastSelectedModel').ollama;

    super(
      'ollama',
      context,
      settingsManager,
      defaultModelName,
      availableModelNames,
    );
  }

  private getAdvanceSettings(historyManager: HistoryManager): {
    systemPrompt: string | undefined;
    generationConfig: Partial<Options>;
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
    const { agentTools, ...toolsSchema } = ToolServiceProvider.getToolSchema();

    if (enabledTools.agentTools?.active && agentTools) {
      for (const [_key, tool] of Object.entries(agentTools)) {
        tools.push({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
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
    historyManager: HistoryManager,
    images?: string[],
  ): Promise<Message[]> {
    const result: Message[] = [];
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

    // Ollama's API requires the query message at the end of the history
    if (result[result.length - 1]?.role !== 'user') {
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
    historyManager: HistoryManager,
    currentEntryID?: string,
    images?: string[],
    selectedModelName?: string,
  ): Promise<{
    client: Ollama;
    conversationHistory: Message[];
    model: string;
  }> {
    const client = new Ollama({
      host: this.settingsManager.get('ollamaClientHost'),
    });

    const conversationHistory = await this.conversationHistoryToContent(
      historyManager.getHistoryBeforeEntry(currentEntryID).entries,
      query,
      historyManager,
      images,
    );

    let model = selectedModelName ?? this.currentModel;
    if (model === 'Auto Detect') {
      model = await this.getRunningModel();
    }

    return { client, conversationHistory, model };
  }

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
    const { client, conversationHistory, model } = await this.initModel(
      query,
      historyManager,
      currentEntryID,
      images,
      selectedModelName,
    );

    if (model === '') {
      return {
        textResponse:
          'The ollama is seems to be down. Please start the ollama service.',
      };
    }

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
    let responseToolCall: ToolCall | undefined = undefined;
    try {
      while (retryCount < MAX_RETRIES) {
        const requestPayload: ChatRequest = {
          model: model,
          messages: conversationHistory,
          tools: disableTools ? undefined : this.getEnabledTools(),
          options: generationConfig,
        };

        if (!sendStreamResponse) {
          const response = await client.chat({
            ...requestPayload,
            stream: false,
          });
          responseText = response.message.content;
          responseToolCall = response.message.tool_calls?.[0];
        } else {
          const streamResponse = await client.chat({
            ...requestPayload,
            stream: true,
          });

          for await (const chunk of streamResponse) {
            if (this.stopStreamFlag) {
              return { textResponse: responseText };
            }

            const chunkContent = chunk.message.content;
            sendStreamResponse(chunkContent);
            responseText += chunkContent;
          }

          // Process the potential tool call
          const responseObject =
            ParseToolCallUtils.extractToolCalls(responseText);
          responseText = responseObject.text;
          responseToolCall = responseObject.toolCall;
        }

        if (!responseToolCall) {
          return { textResponse: responseText };
        }
        const toolCall = {
          id: Date.now().toString(),
          toolName: responseToolCall.function.name,
          parameters: responseToolCall.function.arguments,
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
          role: 'assistant',
          content: responseText,
        });
        conversationHistory.push({
          role: 'user',
          content: validation.feedback,
        });
        retryCount++;
      }
      return { textResponse: responseText };
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
      return {
        textResponse:
          'Failed to connect to the language model service. ' +
          'Make sure the ollama service is running. Also, check the model has been downloaded.',
      };
    } finally {
      this.stopStreamFlag = false;
    }
  }

  public async stopResponse(): Promise<void> {
    this.stopStreamFlag = true;
  }
}
