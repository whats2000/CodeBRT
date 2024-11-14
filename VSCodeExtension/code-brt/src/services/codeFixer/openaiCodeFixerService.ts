import * as vscode from 'vscode';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import type { GetResponseCodeFixerOptions } from '../../types';
import { MODEL_SERVICE_CONSTANTS } from '../../constants';
import { AbstractCodeFixerService } from './base';
import { SettingsManager } from '../../api';
import { CodeFixerModification, CodeFixerResponse } from '../../types';

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

    const generativeModel = new ChatOpenAI({
      apiKey: this.settingsManager.get('openaiApiKey'),
      model: 'gpt-4o',
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
