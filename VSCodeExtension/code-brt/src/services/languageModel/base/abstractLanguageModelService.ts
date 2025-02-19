import * as vscode from 'vscode';

import {
  LanguageModelService,
  GetResponseOptions,
  ModelServiceType,
  ResponseWithAction,
} from '../types';
import { SettingsManager } from '../../../api';
import { OpenRouterModelSettings } from '../../../types';

/**
 * Abstract class for the Language Model Service
 */
export abstract class AbstractLanguageModelService
  implements LanguageModelService
{
  protected constructor(
    protected readonly serviceType: ModelServiceType,
    protected readonly context: vscode.ExtensionContext,
    protected readonly settingsManager: SettingsManager,
    protected currentModel: string,
    protected availableModelNames: string[],
  ) {}

  protected handleGetResponseError(
    error: unknown,
    modelServiceType: ModelServiceType,
    partialResponse?: string,
  ): ResponseWithAction {
    vscode.window
      .showErrorMessage(
        'Failed to get response from ' +
          modelServiceType.charAt(0).toUpperCase() +
          modelServiceType.slice(1) +
          ' Service: ' +
          error,
        'Troubleshooting',
      )
      .then((selection) => {
        if (selection === 'Troubleshooting') {
          void vscode.env.openExternal(
            vscode.Uri.parse(
              'https://whats2000.github.io/CodeBRT/docs/troubleshooting/',
            ),
          );
        }
      });

    return {
      textResponse:
        partialResponse === '' || !partialResponse
          ? 'Failed to get response'
          : partialResponse,
    };
  }

  public updateAvailableModels(newAvailableModels: string[]): void {
    this.availableModelNames = newAvailableModels;
  }

  /**
   * Get the latest version of the language model service
   */
  public async getLatestAvailableModelNames(): Promise<string[]> {
    vscode.window.showErrorMessage(
      'Current this model service does not support updating available models, Please update it manually.',
    );

    return this.availableModelNames;
  }

  public async getLatestAvailableModels(): Promise<OpenRouterModelSettings[]> {
    vscode.window.showErrorMessage(
      'How can you get here? There might be a bug in the code please report it.',
    );

    return [];
  }

  /**
   * Switch to a different model
   * @param newModel - The name of the model to switch to
   */
  public switchModel(newModel: string): void {
    const lastSelectedModel = this.settingsManager.get('lastSelectedModel');
    if (this.availableModelNames.length === 0) {
      this.currentModel = '';
      lastSelectedModel[this.serviceType] = '';
      this.settingsManager
        .set('lastSelectedModel', lastSelectedModel)
        .then(() => {
          void vscode.window.showErrorMessage(
            'No available models to switch to. Please configure the models first.',
          );
        });
      return;
    }

    if (this.availableModelNames.includes(newModel)) {
      this.currentModel = newModel;
      lastSelectedModel[this.serviceType] = newModel;
      void this.settingsManager.set('lastSelectedModel', lastSelectedModel);
    } else {
      void vscode.window.showErrorMessage(
        `Model ${newModel} is not available.`,
      );
    }
  }

  /**
   * Get the response for a query with an image and also fire a view event to send the response in chunks.
   * If the currentEntryID is provided
   * @param options - The options to get a response for
   * @returns The response for the query
   * @see GetResponseOptions
   */
  public abstract getResponse(
    options: GetResponseOptions,
  ): Promise<ResponseWithAction>;

  /**
   * Stop current response
   */
  public async stopResponse(): Promise<void> {
    void vscode.window.showInformationMessage(
      'This feature is not supported by the current model.',
    );
  }
}
