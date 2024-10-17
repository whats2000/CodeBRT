import * as vscode from 'vscode';
import fs from 'fs';
import {
  Content,
  GenerationConfig,
  InlineDataPart,
  Part,
  SchemaType,
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
  NonWorkspaceToolType,
  ResponseWithAction,
  ToolSchema,
} from '../../types';
import { MODEL_SERVICE_CONSTANTS } from '../../constants';
import { mapFunctionDeclarationSchemaType } from './utils';
import { AbstractLanguageModelService } from './base';
import { HistoryManager, SettingsManager } from '../../api';
import { ToolServiceProvider } from '../tools';

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
  private stopStreamFlag = false;

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
  ) {
    const availableModelNames = settingsManager.get('geminiAvailableModels');
    const defaultModelName = settingsManager.get('lastSelectedModel').gemini;

    super(
      'gemini',
      context,
      settingsManager,
      defaultModelName,
      availableModelNames,
    );
  }

  private getAdvanceSettings(historyManager: HistoryManager): {
    systemPrompt: string | undefined;
    generationConfig: Partial<GenerationConfig>;
  } {
    const advanceSettings = historyManager.getCurrentHistory().advanceSettings;

    if (!advanceSettings) {
      return {
        systemPrompt: undefined,
        generationConfig: {},
      };
    }

    if (advanceSettings.presencePenalty || advanceSettings.frequencyPenalty) {
      void vscode.window.showWarningMessage(
        'Presence and Frequency penalties are not supported by the Gemini API, so the settings will be ignored.',
      );
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

    const addTool = (tool: ToolSchema) => {
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
            type: SchemaType;
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
              type: SchemaType.OBJECT,
              properties,
            },
          },
        ],
      });
    };

    const { agentTools, ...toolsSchema } = ToolServiceProvider.getToolSchema();

    if (enabledTools.agentTools?.active && agentTools) {
      for (const [_key, tool] of Object.entries(agentTools)) {
        addTool(tool);
      }
    }

    for (const [key, tool] of Object.entries(toolsSchema)) {
      if (!enabledTools[key as NonWorkspaceToolType]?.active) {
        continue;
      }
      addTool(tool);
    }

    return tools.length > 0 ? tools : undefined;
  }

  private conversationHistoryToContent(
    entries: {
      [key: string]: ConversationEntry;
    },
    historyManager: HistoryManager,
  ): Content[] {
    let result: Content[] = [];
    let currentEntry = entries[historyManager.getCurrentHistory().current];

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
      void vscode.window.showErrorMessage('Failed to read file: ' + error);
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

    const generativeModel = new GoogleGenerativeAI(
      this.settingsManager.get('geminiApiKey'),
    ).getGenerativeModel({
      model: selectedModelName ?? this.currentModel,
    });

    const conversationHistory = this.conversationHistoryToContent(
      historyManager.getHistoryBeforeEntry(currentEntryID).entries,
      historyManager,
    );

    let queryParts = this.createQueryParts(query, images);

    const { systemPrompt, generationConfig } =
      this.getAdvanceSettings(historyManager);
    const systemInstruction: Content | undefined = systemPrompt
      ? {
          role: 'system',
          parts: [{ text: systemPrompt }],
        }
      : undefined;

    try {
      if (!sendStreamResponse) {
        const response = await generativeModel
          .startChat({
            systemInstruction: systemInstruction,
            generationConfig: generationConfig,
            safetySettings: this.safetySettings,
            history: conversationHistory,
            tools: disableTools ? undefined : this.getEnabledTools(),
          })
          .sendMessage(queryParts);

        const functionCalls = response.response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
          // Return the tool call for human-in-the-loop approval
          const functionCall = functionCalls[0];
          return {
            textResponse: response.response.text(),
            toolCall: {
              id: Date.now().toString(),
              toolName: functionCall.name,
              parameters: functionCall.args,
              create_time: Date.now(),
            },
          };
        }

        return { textResponse: response.response.text() };
      } else {
        let responseText = '';

        const result = await generativeModel
          .startChat({
            systemInstruction: systemInstruction,
            generationConfig: generationConfig,
            safetySettings: this.safetySettings,
            history: conversationHistory,
            tools: disableTools ? undefined : this.getEnabledTools(),
          })
          .sendMessageStream(queryParts);

        let functionCalls = null;

        for await (const item of result.stream) {
          if (this.stopStreamFlag) {
            return { textResponse: responseText };
          }

          functionCalls = item.functionCalls();
          if (functionCalls && functionCalls.length > 0) {
            // Handle the tool call here and return for approval
            const functionCall = functionCalls[0];
            return {
              textResponse: responseText,
              toolCall: {
                id: Date.now().toString(),
                toolName: functionCall.name,
                parameters: functionCall.args,
                create_time: Date.now(),
              },
            };
          }

          const partText = item.text();
          sendStreamResponse(partText);
          responseText += partText;
        }

        return { textResponse: responseText };
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
      return {
        textResponse: 'Failed to connect to the language model service.',
      };
    } finally {
      this.stopStreamFlag = false;
    }
  }

  public async stopResponse(): Promise<void> {
    this.stopStreamFlag = true;
  }
}
