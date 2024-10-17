import * as vscode from 'vscode';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import type { GetResponseCodeFixerOptions } from '../../types';
import { MODEL_SERVICE_CONSTANTS } from '../../constants';
import { AbstractCodeFixerService } from './abstractCodeFixerService';
import { SettingsManager } from '../../api';
import { CodeFixerModification, CodeFixerResponse } from '../../types';

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

export class OpenaiCodeFixerService extends AbstractCodeFixerService {
  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    const availableModelNames = settingsManager.get(
      'codeFixerOpenaiAvailableModels',
    );
    const defaultModelName = settingsManager.get(
      'codeFixerLastSelectedModel',
    ).openai;

    super(
      'openai',
      context,
      settingsManager,
      defaultModelName,
      availableModelNames,
    );
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

  public async getResponse(
    options: GetResponseCodeFixerOptions,
  ): Promise<CodeFixerResponse> {
    if (this.currentModel === '') {
      vscode.window.showErrorMessage(
        'Make sure the model is selected before sending a message. Open the model selection dropdown and configure the model.',
      );
      return {
        modifications: [],
        success: false,
        error:
          'Missing model configuration. Check the model selection dropdown.',
      };
    }

    // // Initialize the status to 'waitForResponse'
    // if (options.sendCodeFixerStatus) {
    //   this.updateStatus('codeFixer', 'waitForResponse');
    //   options.sendCodeFixerStatus(this.statuses);
    // }

    console.log('currentModel:', this.currentModel);
    const generativeModel = new ChatOpenAI({
      apiKey: this.settingsManager.get('openaiApiKey'),
      model: this.currentModel,
      temperature: 0,
    });

    const parser = new JsonOutputParser<CodeFixerModification[]>();
    const promptTemplate = ChatPromptTemplate.fromTemplate(this.prompt);
    // 部分应用模板
    const partialedPrompt = await promptTemplate.partial({
      format_instructions: this.formatInstructions,
    });
    // 组合模型和解析器链
    const chain = partialedPrompt.pipe(generativeModel).pipe(parser);

    try {
      const response = await chain.invoke({
        userQuery: options.userQuery,
        originalCode: options.originalCode,
        generatedCode: options.generatedCode,
      });
      // // Update the status to 'receivedResponse'.
      // if (options.sendCodeFixerStatus) {
      //   this.updateStatus('codeFixer', 'receivedResponse');
      //   options.sendCodeFixerStatus(this.statuses);
      // }
      // console.log('promptTemplate:', promptTemplate);
      // console.log('Response: ', response);
      return {
        modifications: response,
        success: true,
      };
    } catch (error) {
      vscode.window
        .showErrorMessage(
          'Failed to get response from Openai Service: ' + error,
          'Get API Key',
        )
        .then((selection) => {
          if (selection === 'Get API Key') {
            vscode.env.openExternal(
              vscode.Uri.parse(MODEL_SERVICE_CONSTANTS.openai.apiLink),
            );
          }
        });
      return {
        modifications: [],
        success: false,
        error: 'Failed to connect to the language model service.',
      };
    }
  }
}
