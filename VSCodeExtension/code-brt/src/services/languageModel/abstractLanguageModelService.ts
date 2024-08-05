import * as vscode from 'vscode';

import {
  ConversationHistory,
  LanguageModelService,
  GetResponseOptions,
  ModelServiceType,
} from '../../types';
import { HistoryManager, SettingsManager } from '../../api';

/**
 * Abstract class for the Language Model Service
 */
export abstract class AbstractLanguageModelService
  implements LanguageModelService
{
  protected readonly settingsManager: SettingsManager;
  protected readonly historyManager: HistoryManager;
  protected readonly serviceType: ModelServiceType;
  protected readonly context: vscode.ExtensionContext;
  protected history: ConversationHistory = this.getDefaultConversationHistory();
  protected currentModel: string = '';
  protected availableModelNames: string[] = [];

  protected constructor(
    serviceType: ModelServiceType,
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    historyManager: HistoryManager,
    currentModel: string,
    availableModelNames: string[],
  ) {
    this.serviceType = serviceType;
    this.context = context;
    this.settingsManager = settingsManager;
    this.historyManager = historyManager;
    this.currentModel = currentModel;
    this.availableModelNames = availableModelNames;
  }

  /**
   * Get the default empty conversation history
   */
  private getDefaultConversationHistory(): ConversationHistory {
    return {
      title: '',
      root: '',
      top: [],
      current: '',
      create_time: Date.now(),
      update_time: Date.now(),
      entries: {},
    };
  }

  /**
   * Get the history before a given entry id
   * @param currentEntryID - The entry id to get the history before
   * @returns The conversation history before the given entry id
   */
  protected getHistoryBeforeEntry(
    currentEntryID?: string,
  ): ConversationHistory {
    return this.historyManager.getHistoryBeforeEntry(currentEntryID);
  }

  public updateAvailableModels(newAvailableModels: string[]): void {
    this.availableModelNames = newAvailableModels;
  }

  /**
   * Get the latest version of the language model service
   */
  public async getLatestAvailableModelNames(): Promise<string[]> {
    vscode.window
      .showErrorMessage(
        'Current this model service does not support updating available models, Please update it manually.',
      )
      .then();

    return this.availableModelNames;
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
          vscode.window
            .showErrorMessage(
              'No available models to switch to. Please configure the models first.',
            )
            .then();
        });
      return;
    }

    if (this.availableModelNames.includes(newModel)) {
      this.currentModel = newModel;
      lastSelectedModel[this.serviceType] = newModel;
      this.settingsManager
        .set('lastSelectedModel', lastSelectedModel)
        .then(() => {
          vscode.window
            .showInformationMessage(`Switched to model: ${newModel}`)
            .then();
        });
    } else {
      vscode.window
        .showErrorMessage(`Model ${newModel} is not available.`)
        .then();
    }
  }

  /**
   * Stop current response
   */
  public async stopResponse(): Promise<void> {
    vscode.window
      .showInformationMessage(
        'This feature is not supported by the current model.',
      )
      .then();
  }

  /**
   * Get the response for a query with an image and also fire a view event to send the response in chunks.
   * If the currentEntryID is provided
   * @param options - The options to get a response for
   * @returns The response for the query
   * @see GetResponseOptions
   */
  public abstract getResponse(options: GetResponseOptions): Promise<string>;
}
