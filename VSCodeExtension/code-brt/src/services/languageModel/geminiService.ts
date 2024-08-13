import * as vscode from 'vscode';
import fs from 'fs';
import type {
  Content,
  FunctionCall,
  FunctionResponsePart,
  GenerationConfig,
  InlineDataPart,
  Part,
  Tool,
} from '@google/generative-ai';
import {
  FunctionDeclarationSchemaType,
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai';

import type {
  ConversationEntry,
  GetResponseOptions,
  ToolServiceType,
} from '../../types';
import { MODEL_SERVICE_CONSTANTS, toolsSchema } from '../../constants';
import { mapFunctionDeclarationSchemaType } from '../../utils';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import { HistoryManager, SettingsManager } from '../../api';
import { ToolService } from '../tools';

type GeminiModel = {
  name: string;
  baseModelId: string;
  version: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
  temperature: number;
  topP: number;
  topK: number;
};

type GeminiModelsList = {
  models: GeminiModel[];
};

export class GeminiService extends AbstractLanguageModelService {
  private readonly safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    historyManager: HistoryManager,
  ) {
    const availableModelNames = settingsManager.get('geminiAvailableModels');
    const defaultModelName = settingsManager.get('lastSelectedModel').gemini;

    super(
      'gemini',
      context,
      settingsManager,
      historyManager,
      defaultModelName,
      availableModelNames,
    );
  }

  private getAdvanceSettings(): {
    systemPrompt: string | undefined;
    generationConfig: Partial<GenerationConfig>;
  } {
    const advanceSettings =
      this.historyManager.getCurrentHistory().advanceSettings;

    if (!advanceSettings) {
      return {
        systemPrompt: undefined,
        generationConfig: {},
      };
    }

    if (advanceSettings.presencePenalty || advanceSettings.frequencyPenalty) {
      vscode.window
        .showWarningMessage(
          'Presence and Frequency penalties are not supported by the Gemini API, so the settings will be ignored.',
        )
        .then();
    }

    return {
      systemPrompt:
        advanceSettings.systemPrompt.length > 0
          ? advanceSettings.systemPrompt
          : undefined,
      generationConfig: {
        maxOutputTokens: advanceSettings.maxTokens,
        temperature: advanceSettings.temperature,
        topP: advanceSettings.topP,
        topK: advanceSettings.topK,
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

      const properties = Object.keys(tool.inputSchema.properties).reduce(
        (acc, key) => {
          const property = tool.inputSchema.properties[key];
          acc[key] = {
            type: mapFunctionDeclarationSchemaType(property.type),
            description: property.description,
            nullable: !tool.inputSchema.required.includes(key),
          };
          return acc;
        },
        {} as {
          [key: string]: {
            type: FunctionDeclarationSchemaType;
            description: string;
            nullable: boolean;
          };
        },
      );

      tools.push({
        functionDeclarations: [
          {
            name: tool.name,
            description: tool.description,
            parameters: {
              type: FunctionDeclarationSchemaType.OBJECT,
              properties,
            },
          },
        ],
      });
    }

    return tools.length > 0 ? tools : undefined;
  }

  private conversationHistoryToContent(entries: {
    [key: string]: ConversationEntry;
  }): Content[] {
    let result: Content[] = [];
    let currentEntry = entries[this.historyManager.getCurrentHistory().current];

    while (currentEntry) {
      result.unshift({
        role: currentEntry.role === 'AI' ? 'model' : 'user',
        parts: [{ text: currentEntry.message }],
      });

      if (currentEntry.parent) {
        currentEntry = entries[currentEntry.parent];
      } else {
        break;
      }
    }

    // Gemini's history doesn't include the query message
    if (result.length > 0 && result[result.length - 1].role === 'user') {
      result.pop();
    }

    return result;
  }

  private createQueryParts(query: string, images?: string[]): Part[] {
    let parts: Part[] = [{ text: query }];

    if (images) {
      const imageParts = images
        .map((image) =>
          this.fileToGenerativePart(image, `image/${image.split('.').pop()}`),
        )
        .filter((part) => part !== undefined) as InlineDataPart[];

      parts = [...parts, ...imageParts];
    }

    return parts;
  }

  private fileToGenerativePart(
    path: string,
    mimeType: string,
  ): InlineDataPart | undefined {
    try {
      const buffer = Buffer.from(fs.readFileSync(path)).toString('base64');
      return {
        inlineData: {
          data: buffer,
          mimeType,
        },
      };
    } catch (error) {
      vscode.window.showErrorMessage('Failed to read file: ' + error).then();
    }
  }

  public async getLatestAvailableModelNames(): Promise<string[]> {
    const requestUrl =
      `https://generativelanguage.googleapis.com/v1beta/models?key=` +
      this.settingsManager.get('geminiApiKey');

    let newAvailableModelNames: string[] = [...this.availableModelNames];

    try {
      const response = await fetch(requestUrl);

      if (!response.ok) {
        vscode.window.showErrorMessage(
          'Failed to fetch available models from Gemini Service: ' +
            response.statusText,
        );
        return this.availableModelNames;
      }

      const data: GeminiModelsList = await response.json();
      const latestModels = data.models || [];

      // Filter the invalid models (Not existing in the latest models)
      newAvailableModelNames = newAvailableModelNames.filter((name) =>
        latestModels.some((model) => model.name === `models/${name}`),
      );

      // Append the models to the available models if they aren't already there
      latestModels.forEach((model) => {
        if (!model.name || !model.supportedGenerationMethods) return;
        if (newAvailableModelNames.includes(model.name.replace('models/', '')))
          return;
        if (!model.supportedGenerationMethods.includes('generateContent'))
          return;

        newAvailableModelNames.push(model.name.replace('models/', ''));
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to fetch available models: ' + error,
      );
    }

    return newAvailableModelNames;
  }

  private async handleFunctionCalls(
    functionCalls: FunctionCall[],
    updateStatus?: (status: string) => void,
  ): Promise<FunctionResponsePart[]> {
    const functionCallResults: FunctionResponsePart[] = [];

    for (const functionCall of functionCalls) {
      const tool = ToolService.getTool(functionCall.name);
      if (!tool) {
        functionCallResults.push({
          functionResponse: {
            name: functionCall.name,
            response: {
              error: `Failed to find tool with name: ${functionCall.name}`,
            },
          },
        });
        continue;
      }

      try {
        const args = { ...functionCall.args, updateStatus };
        const result = await tool(args as any);
        functionCallResults.push({
          functionResponse: {
            name: functionCall.name,
            response: {
              searchResults: result,
            },
          },
        });
      } catch (error) {
        functionCallResults.push({
          functionResponse: {
            name: functionCall.name,
            response: {
              error: `Error executing tool ${functionCall.name}: ${error}`,
            },
          },
        });
      }
    }

    return functionCallResults;
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

    const generativeModel = new GoogleGenerativeAI(
      this.settingsManager.get('geminiApiKey'),
    ).getGenerativeModel({
      model: this.currentModel,
    });

    const conversationHistory = this.conversationHistoryToContent(
      this.historyManager.getHistoryBeforeEntry(currentEntryID).entries,
    );

    let queryParts = this.createQueryParts(query, images);
    let functionCallCount = 0;
    const MAX_FUNCTION_CALLS = 5;

    const { systemPrompt, generationConfig } = this.getAdvanceSettings();
    const systemInstruction: Content | undefined = systemPrompt
      ? {
          role: 'system',
          parts: [{ text: systemPrompt }],
        }
      : undefined;

    try {
      if (!sendStreamResponse) {
        while (functionCallCount < MAX_FUNCTION_CALLS) {
          const response = await generativeModel
            .startChat({
              systemInstruction: systemInstruction,
              generationConfig: generationConfig,
              safetySettings: this.safetySettings,
              history: conversationHistory,
              tools: this.getEnabledTools(),
            })
            .sendMessage(queryParts);

          const functionCalls = response.response.functionCalls();

          if (!functionCalls) {
            return response.response.text();
          }

          const functionCallResults =
            await this.handleFunctionCalls(functionCalls);

          conversationHistory.push({
            role: 'user',
            parts: queryParts,
          });

          conversationHistory.push({
            role: 'model',
            parts: functionCalls.map((part) => ({
              functionCall: part,
            })),
          });

          queryParts = functionCallResults;

          functionCallCount++;
        }
        return 'Max function call limit reached.';
      } else {
        let responseText = '';

        while (functionCallCount < MAX_FUNCTION_CALLS) {
          const result = await generativeModel
            .startChat({
              systemInstruction: systemInstruction,
              generationConfig: generationConfig,
              safetySettings: this.safetySettings,
              history: conversationHistory,
              tools: this.getEnabledTools(),
            })
            .sendMessageStream(queryParts);

          let functionCalls = null;
          updateStatus && updateStatus('');

          for await (const item of result.stream) {
            functionCalls = item.functionCalls();
            if (functionCalls) {
              const functionCallResults = await this.handleFunctionCalls(
                functionCalls,
                updateStatus,
              );
              conversationHistory.push({
                role: 'user',
                parts: queryParts,
              });
              conversationHistory.push({
                role: 'model',
                parts: functionCalls.map((part) => ({
                  functionCall: part,
                })),
              });
              queryParts = functionCallResults;
              break;
            }
            const partText = item.text();
            sendStreamResponse(partText);
            responseText += partText;
          }

          if (!functionCalls) {
            return responseText;
          }
          functionCallCount++;
        }
        return responseText;
      }
    } catch (error) {
      vscode.window
        .showErrorMessage(
          'Failed to get response from Gemini Service: ' + error,
          'Get API Key',
        )
        .then((selection) => {
          if (selection === 'Get API Key') {
            vscode.env.openExternal(
              vscode.Uri.parse(MODEL_SERVICE_CONSTANTS.gemini.apiLink),
            );
          }
        });
      return 'Failed to connect to the language model service.';
    }
  }
}
