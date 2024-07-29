import * as vscode from 'vscode';
import type { ChatMessage, Tool, ToolCall } from 'cohere-ai/api';
import { CohereClient } from 'cohere-ai';

import { ConversationEntry, GetResponseOptions } from '../../types';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import { SettingsManager } from '../../api';
import { ToolService } from '../tools';

export class CohereService extends AbstractLanguageModelService {
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  private readonly tools: Tool[] = [
    {
      name: 'webSearch',
      description: `Use this tool to fetch the latest information from the web, especially for time-sensitive or recent data.

          Guidelines:
          1. Ensure queries are well-defined. Example: 'Google AI recent developments 2024'.
          2. Utilize this tool for queries involving recent events or updates.
          3. Refuse only if the query is unclear or beyond the tool's scope. Suggest refinements if needed.
          4. Extract up to 6000 characters per webpage. Default to 4 results.

          Validate information before presenting and provide balanced views if there are discrepancies.`,
      parameterDefinitions: {
        query: {
          description:
            'The query to search for. Ensure the query is specific and well-defined to get precise results.',
          type: 'str',
          required: true,
        },
        maxCharsPerPage: {
          description:
            'The maximum number of characters to extract from each webpage. Default is 6000. Adjust if a different limit is required.',
          type: 'int',
          required: false,
        },
        numResults: {
          description:
            'The number of results to return. Default is 4. Modify if more or fewer results are needed.',
          type: 'int',
          required: false,
        },
      },
    },
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
      'cohereConversationHistory.json',
      settingsManager,
      defaultModelName,
      availableModelNames,
    );

    this.apiKey = settingsManager.get('cohereApiKey');

    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize Cohere Service History: ' + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('repo-code-assistant.cohereApiKey')) {
        this.apiKey = settingsManager.get('cohereApiKey');
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistories();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to initialize Cohere Service: ' + error,
      );
    }
  }

  private conversationHistoryToContent(entries: {
    [key: string]: ConversationEntry;
  }): ChatMessage[] {
    let result: ChatMessage[] = [];
    let currentEntry = entries[this.history.current];

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

  private async handleFunctionCalls(
    functionCalls: ToolCall[],
    updateStatus?: (status: string) => void,
  ): Promise<string[]> {
    const functionCallResults: string[] = [];

    for (const functionCall of functionCalls) {
      const tool = ToolService.getTool(functionCall.name);
      if (!tool) {
        functionCallResults.push(
          `Failed to find tool with name: ${functionCall.name}`,
        );
        continue;
      }

      try {
        const result = await tool({
          ...functionCall.parameters,
          updateStatus,
        } as any);
        functionCallResults.push(result);
      } catch (error) {
        functionCallResults.push(
          `Error executing tool ${functionCall.name}: ${error}`,
        );
      }
    }

    return functionCallResults;
  }

  public async getLatestAvailableModelNames(): Promise<string[]> {
    const cohere = new CohereClient({
      token: this.apiKey,
    });

    let newAvailableModelNames: string[] = [...this.availableModelNames];

    try {
      const latestModels = (await cohere.models.list()).models;

      // Filter the invalid models (Not existing in the latest models)
      newAvailableModelNames = newAvailableModelNames.filter((name) =>
        latestModels.some((model) => model.name === name),
      );

      // Append the models to the available models if they are not already there
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

    const model = new CohereClient({ token: this.apiKey });

    const conversationHistory = this.conversationHistoryToContent(
      this.getHistoryBeforeEntry(currentEntryID).entries,
    );

    const requestData = {
      chatHistory: conversationHistory,
      model: this.currentModel,
      message: query,
    };

    try {
      if (!sendStreamResponse) {
        const result = await model.chat({
          ...requestData,
          tools: this.currentModel !== 'command' ? this.tools : undefined,
        });

        if (result.toolCalls) {
          const functionCallResults = await this.handleFunctionCalls(
            result.toolCalls,
          );

          return (
            await model.chat({
              ...{
                ...requestData,
                message: `${query}\n\n${functionCallResults.join('\n\n')}`,
              },
            })
          ).text;
        }

        return (await model.chat(requestData)).text;
      }

      const result = await model.chatStream({
        ...requestData,
        tools: this.tools,
      });
      let responseText = '';
      for await (const item of result) {
        if (item.eventType === 'tool-calls-generation') {
          const functionCallResults = await this.handleFunctionCalls(
            item.toolCalls,
            updateStatus,
          );

          const newResult = await model.chatStream({
            ...{
              ...requestData,
              message: `${query}\n\n${functionCallResults.join('\n\n')}`,
            },
          });

          if (updateStatus) {
            updateStatus('');
          }

          for await (const newItem of newResult) {
            if (newItem.eventType === 'text-generation') {
              const partText = newItem.text;
              sendStreamResponse(partText);
              responseText += partText;
            }
          }
        } else if (item.eventType === 'text-generation') {
          const partText = item.text;
          sendStreamResponse(partText);
          responseText += partText;
        }
      }

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Cohere Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }
}
