import * as vscode from 'vscode';
import fs from 'fs';
import {
  Content,
  FunctionCall,
  FunctionDeclarationSchemaType,
  FunctionResponsePart,
  InlineDataPart,
  Part,
  Tool,
} from '@google/generative-ai';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai';

import type {
  ConversationEntry,
  GetResponseOptions,
  ToolServiceType,
} from '../../types';
import { MODEL_SERVICE_LINKS, toolsSchema } from '../../constants';
import { mapFunctionDeclarationSchemaType } from '../../utils';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import { SettingsManager } from '../../api';
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
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  private readonly generationConfig = {
    temperature: 1,
    topK: 0,
    topP: 0.95,
    maxOutputTokens: 8192,
  };

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

  private readonly tools: Tool[] = [];

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get('geminiAvailableModels');
    const defaultModelName = settingsManager.get('lastSelectedModel').gemini;

    super(
      'gemini',
      context,
      'geminiConversationHistory.json',
      settingsManager,
      defaultModelName,
      availableModelNames,
    );
    this.apiKey = settingsManager.get('geminiApiKey');
    this.tools = this.buildTools();

    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize Gemini Service: ' + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('code-brt.geminiApiKey')) {
        this.apiKey = settingsManager.get('geminiApiKey');
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistories();
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to initialize Gemini Service History: ' + error,
      );
    }
  }

  private buildTools(): Tool[] {
    return Object.keys(toolsSchema).map((toolKey) => {
      const tool = toolsSchema[toolKey as ToolServiceType];
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

      return {
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
      };
    });
  }

  private conversationHistoryToContent(entries: {
    [key: string]: ConversationEntry;
  }): Content[] {
    let result: Content[] = [];
    let currentEntry = entries[this.history.current];

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
    const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`;

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

      // Append the models to the available models if they are not already there
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
      this.apiKey,
    ).getGenerativeModel({
      model: this.currentModel,
    });

    const conversationHistory = this.conversationHistoryToContent(
      this.getHistoryBeforeEntry(currentEntryID).entries,
    );

    let queryParts = this.createQueryParts(query, images);
    let functionCallCount = 0;
    const MAX_FUNCTION_CALLS = 5;
    try {
      if (!sendStreamResponse) {
        while (functionCallCount < MAX_FUNCTION_CALLS) {
          const response = await generativeModel
            .startChat({
              generationConfig: this.generationConfig,
              safetySettings: this.safetySettings,
              history: conversationHistory,
              tools: this.tools,
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
              generationConfig: this.generationConfig,
              safetySettings: this.safetySettings,
              history: conversationHistory,
              tools: this.tools,
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
              vscode.Uri.parse(MODEL_SERVICE_LINKS.geminiApiKey as string),
            );
          }
        });
      return 'Failed to connect to the language model service.';
    }
  }
}
