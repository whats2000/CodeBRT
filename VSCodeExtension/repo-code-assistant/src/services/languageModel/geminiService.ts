import * as vscode from 'vscode';
import fs from 'fs';
import {
  Content,
  FunctionCall,
  FunctionDeclarationSchemaType,
  GenerativeModel,
  InlineDataPart,
  Tool,
} from '@google/generative-ai';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai';

import type { ConversationEntry, GetResponseOptions } from '../../types';
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

  private readonly tools: Tool[] = [
    {
      functionDeclarations: [
        {
          name: 'webSearch',
          description: `
          Use this tool to fetch the latest information from the web, especially for time-sensitive or recent data.
          
          Guidelines:
          1. Ensure queries are well-defined. Example: 'Google AI recent developments 2024'.
          2. Utilize this tool for queries involving recent events or updates.
          3. Refuse only if the query is unclear or beyond the tool's scope. Suggest refinements if needed.
          4. Extract up to 6000 characters per webpage. Default to 4 results.
          
          Validate information before presenting and provide balanced views if there are discrepancies.
        `,
          parameters: {
            type: FunctionDeclarationSchemaType.OBJECT,
            properties: {
              query: {
                type: FunctionDeclarationSchemaType.STRING,
                description:
                  'The query to search for. Ensure the query is specific and well-defined to get precise results.',
                example: 'Google AI recent developments 2024',
              },
              maxCharsPerPage: {
                type: FunctionDeclarationSchemaType.NUMBER,
                description:
                  'The maximum number of characters to extract from each webpage. Default is 6000. Adjust if a different limit is required.',
                nullable: true,
              },
              numResults: {
                type: FunctionDeclarationSchemaType.NUMBER,
                description:
                  'The number of results to return. Default is 4. Modify if more or fewer results are needed.',
                nullable: true,
              },
            },
          },
        },
      ],
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
      'geminiConversationHistory.json',
      settingsManager,
      defaultModelName,
      availableModelNames,
    );
    this.apiKey = settingsManager.get('geminiApiKey');

    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize Gemini Service: ' + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('repo-code-assistant.geminiApiKey')) {
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

  private fileToGenerativePart(path: string, mimeType: string): InlineDataPart {
    return {
      inlineData: {
        data: Buffer.from(fs.readFileSync(path)).toString('base64'),
        mimeType,
      },
    };
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
        const args = { ...functionCall.args, updateStatus };
        const result = await tool(args as any);
        functionCallResults.push(result);
      } catch (error) {
        functionCallResults.push(
          `Error executing tool ${functionCall.name}: ${error}`,
        );
      }
    }

    return functionCallResults;
  }

  private async getResponseChunksWithTextPayload(
    generativeModel: GenerativeModel,
    query: string,
    conversationHistory: Content[],
    sendStreamResponse?: (message: string) => void,
    updateStatus?: (status: string) => void,
  ): Promise<string> {
    try {
      if (!sendStreamResponse) {
        const result = await generativeModel
          .startChat({
            generationConfig: this.generationConfig,
            safetySettings: this.safetySettings,
            history: conversationHistory,
            tools: this.tools,
          })
          .sendMessage(query);

        if (result.response.functionCalls()) {
          const functionCallResults = await this.handleFunctionCalls(
            result.response.functionCalls() as FunctionCall[],
          );

          // Regenerate the query with the tool results
          return (
            await generativeModel
              .startChat({
                generationConfig: this.generationConfig,
                safetySettings: this.safetySettings,
                history: conversationHistory,
              })
              .sendMessage(`${query}\n\n${functionCallResults.join('\n\n')}`)
          ).response.text();
        }

        return (
          await generativeModel
            .startChat({
              generationConfig: this.generationConfig,
              safetySettings: this.safetySettings,
              history: conversationHistory,
            })
            .sendMessage(query)
        ).response.text();
      }

      const chat = generativeModel.startChat({
        generationConfig: this.generationConfig,
        safetySettings: this.safetySettings,
        history: conversationHistory,
        tools: this.tools,
      });

      let responseText = '';
      const result = await chat.sendMessageStream(query);
      for await (const item of result.stream) {
        if (item.functionCalls()) {
          const functionCallResults = await this.handleFunctionCalls(
            item.functionCalls() as FunctionCall[],
            updateStatus,
          );

          // Regenerate the query with the tool results
          const newResult = await chat.sendMessageStream(
            `${query}\n\n${functionCallResults.join('\n\n')}`,
          );

          if (updateStatus) {
            updateStatus('');
          }

          for await (const newItem of newResult.stream) {
            const partText = newItem.text();
            sendStreamResponse(partText);
            responseText += partText;
          }
        } else {
          const partText = item.text();
          sendStreamResponse(partText);
          responseText += partText;
        }
      }

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Gemini Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
  }

  private async getResponseChunksWithImagePayload(
    generativeModel: GenerativeModel,
    query: string,
    images: string[],
    _conversationHistory: Content[],
    sendStreamResponse?: (message: string) => void,
    updateStatus?: (status: string) => void,
  ): Promise<string> {
    try {
      const imageParts = images.map((image) => {
        return this.fileToGenerativePart(
          image,
          `image/${image.split('.').pop()}`,
        );
      });

      if (!sendStreamResponse) {
        const result = await generativeModel.generateContent({
          generationConfig: this.generationConfig,
          contents: [{ role: 'user', parts: [{ text: query }, ...imageParts] }],
        });

        return result.response.text();
      }

      let responseText = '';
      const result = await generativeModel.generateContentStream({
        generationConfig: this.generationConfig,
        contents: [{ role: 'user', parts: [{ text: query }, ...imageParts] }],
      });

      for await (const item of result.stream) {
        if (item.functionCalls()) {
          const functionCallResults = await this.handleFunctionCalls(
            item.functionCalls() as FunctionCall[],
            updateStatus,
          );

          // Regenerate the query with the tool results
          const newResult = await generativeModel.generateContentStream({
            generationConfig: this.generationConfig,
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${query}\n\n${functionCallResults.join('\n\n')}` },
                  ...imageParts,
                ],
              },
            ],
          });

          if (updateStatus) {
            updateStatus('');
          }

          for await (const newItem of newResult.stream) {
            const partText = newItem.text();
            sendStreamResponse(partText);
            responseText += partText;
          }
        } else {
          const partText = item.text();
          sendStreamResponse(partText);
          responseText += partText;
        }
      }

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from Gemini Service: ' + error,
      );
      return 'Failed to connect to the language model service.';
    }
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

    if (images && images.length > 0) {
      return this.getResponseChunksWithImagePayload(
        generativeModel,
        query,
        images,
        conversationHistory,
        sendStreamResponse,
        updateStatus,
      );
    }

    return this.getResponseChunksWithTextPayload(
      generativeModel,
      query,
      conversationHistory,
      sendStreamResponse,
      updateStatus,
    );
  }
}
