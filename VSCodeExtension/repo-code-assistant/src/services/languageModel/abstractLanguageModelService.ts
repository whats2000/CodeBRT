import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidV4 } from 'uuid';

import * as vscode from 'vscode';

import {
  ConversationHistory,
  ConversationEntry,
  ConversationHistoryList,
  LanguageModelService,
  GetResponseOptions,
  ModelServiceType,
} from '../../types';
import { SettingsManager } from '../../api';

/**
 * Abstract class for the Language Model Service
 */
export abstract class AbstractLanguageModelService
  implements LanguageModelService
{
  /**
   * The type of the service
   * @protected
   */
  protected serviceType: ModelServiceType;

  /**
   * The extension context
   * @protected
   */
  protected context: vscode.ExtensionContext;

  /**
   * The path to the history file
   * @protected
   */
  protected historyFilePath: string | null;

  /**
   * The settings manager
   * @protected
   */
  protected settingsManager: SettingsManager;

  /**
   * The current conversation history
   * @protected
   */
  protected history: ConversationHistory = this.getDefaultConversationHistory();

  /**
   * The list of conversation histories
   * @protected
   */
  protected histories: ConversationHistoryList = {};

  /**
   * The current in-use model
   * @protected
   */
  protected currentModel: string = '';

  /**
   * The list of available model names
   */
  protected availableModelNames: string[] = [];

  /**
   * Constructor for the AbstractLanguageModelService
   * @param serviceType - The type of the service
   * @param context - The extension context
   * @param historyFileName - The name of the history file
   * @param settingsManager - The settings manager
   * @param currentModel - The current in-use model
   * @param availableModelNames - The list of available model names
   * @protected
   */
  protected constructor(
    serviceType: ModelServiceType,
    context: vscode.ExtensionContext,
    historyFileName: string,
    settingsManager: SettingsManager,
    currentModel: string,
    availableModelNames: string[],
  ) {
    this.serviceType = serviceType;
    this.context = context;
    this.settingsManager = settingsManager;
    this.currentModel = currentModel;
    this.availableModelNames = availableModelNames;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      if (
        !fs.existsSync(path.join(workspaceFolders[0].uri.fsPath, '.vscode'))
      ) {
        fs.mkdirSync(path.join(workspaceFolders[0].uri.fsPath, '.vscode'));
      }

      this.historyFilePath = path.join(
        workspaceFolders[0].uri.fsPath,
        '.vscode',
        historyFileName,
      );
    } else {
      this.historyFilePath = null;
    }
  }

  /**
   * Get the history before a given entry id
   * @param currentEntryID - The entry id to get the history before
   * @returns The conversation history before the given entry id
   */
  protected getHistoryBeforeEntry(
    currentEntryID?: string,
  ): ConversationHistory {
    if (!currentEntryID) return this.history;

    const newHistory: ConversationHistory = {
      title: this.history.title,
      root: this.history.root,
      top: this.history.top,
      current: currentEntryID,
      create_time: this.history.create_time,
      update_time: Date.now(),
      entries: {},
    };

    const entryStack = [];
    let currentEntry = this.history.entries[currentEntryID];

    while (currentEntry) {
      entryStack.push(currentEntry);
      if (currentEntry.parent) {
        currentEntry = this.history.entries[currentEntry.parent];
      } else {
        break;
      }
    }

    entryStack.reverse().forEach((entry) => {
      newHistory.entries[entry.id] = entry;
    });

    return newHistory;
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
   * Get the default empty conversation history
   */
  public getDefaultConversationHistory(): ConversationHistory {
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
   * Load all conversation histories from the history file
   */
  public async loadHistories(): Promise<void> {
    if (!this.historyFilePath) {
      return;
    }
    if (!fs.existsSync(this.historyFilePath)) {
      return;
    }
    try {
      const data = await fs.promises.readFile(this.historyFilePath, 'utf8');
      const histories: ConversationHistoryList = JSON.parse(data);
      this.histories = histories;
      if (Object.keys(histories).length > 0) {
        for (const historyID in histories) {
          if (!histories[historyID].top && histories[historyID].root !== '') {
            histories[historyID].top = [histories[historyID].root];
          }
        }

        this.history = histories[Object.keys(histories)[0]];
      }
    } catch (error) {
      vscode.window.showErrorMessage('Failed to load histories: ' + error);
    }
  }

  /**
   * Save all conversation histories to the history file
   */
  public async saveHistories(): Promise<void> {
    if (!this.historyFilePath) {
      return;
    }
    try {
      const data = JSON.stringify(this.histories, null, 2);
      await fs.promises.writeFile(this.historyFilePath, data, 'utf8');
    } catch (error) {
      vscode.window.showErrorMessage('Failed to save histories: ' + error);
    }
  }

  /**
   * Get the current conversation history
   */
  public getConversationHistory(): ConversationHistory {
    return this.history;
  }

  /**
   * Add a new conversation history
   */
  public addNewConversationHistory(): ConversationHistory {
    const newHistory: ConversationHistory =
      this.getDefaultConversationHistory();

    this.histories[newHistory.root] = newHistory;
    this.history = newHistory;

    this.saveHistories().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to add new conversation history: ' + error,
      ),
    );

    return newHistory;
  }

  /**
   * Add a new entry to the conversation history
   * @param parentID - The parent ID of the new entry
   * @param role - The role of the new entry ('user' or 'AI')
   * @param message - The message of the new entry
   * @param images - The images referenced by the entry
   * @returns The ID of the newly created entry
   */
  public addConversationEntry(
    parentID: string | null,
    role: 'user' | 'AI',
    message: string,
    images?: string[],
  ): string {
    const newID = uuidV4();
    const newEntry: ConversationEntry = {
      id: newID,
      role: role,
      message: message,
      images: images,
      parent: parentID,
      children: [],
    };

    if (parentID) {
      if (!this.history.entries[parentID]) {
        vscode.window
          .showErrorMessage('Parent entry not found: ' + parentID)
          .then();
        return '';
      }
      this.history.entries[parentID].children.push(newID);
    } else {
      this.history.top.push(newID);
    }

    if (this.history.root === '') {
      delete this.histories[this.history.root];
      this.history.root = newID;
      this.history.title = `${message.substring(0, 20)}...`;
    }

    this.history.entries[newID] = newEntry;
    this.history.update_time = Date.now();
    this.history.current = newID;
    this.histories[this.history.root] = this.history;
    this.saveHistories().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to add conversation entry: ' + error,
      ),
    );

    return newID;
  }

  /**
   * Edit the conversation history
   * @param entryID - The ID of the entry to edit
   * @param newMessage - The new message to replace the entry with
   */
  public editConversationEntry(entryID: string, newMessage: string): void {
    if (this.history.entries[entryID]) {
      this.history.entries[entryID].message = newMessage;
      this.history.update_time = Date.now();
      this.histories[this.history.root] = this.history;
      this.saveHistories().catch((error) =>
        vscode.window.showErrorMessage(
          'Failed to edit conversation entry: ' + error,
        ),
      );
    } else {
      vscode.window
        .showErrorMessage('Entry not found: ' + entryID)
        .then(() => console.error('Entry not found: ' + entryID));
    }
  }

  /**
   * Update the title of a specified conversation history by its ID
   * @param historyID - The ID of the history to update
   * @param newTitle - The new title for the conversation history
   */
  public updateHistoryTitleById(historyID: string, newTitle: string): void {
    if (this.histories[historyID]) {
      this.histories[historyID].title = newTitle;
      this.histories[historyID].update_time = Date.now();
      this.saveHistories().catch((error) =>
        vscode.window.showErrorMessage(
          'Failed to update conversation title: ' + error,
        ),
      );
    } else {
      vscode.window.showErrorMessage('History not found: ' + historyID).then();
    }
  }

  /**
   * Switch to a different conversation history
   * @param historyID - The ID of the history to switch to
   */
  public switchHistory(historyID: string): void {
    if (this.histories[historyID]) {
      this.history = this.histories[historyID];
      this.saveHistories().catch((error) =>
        vscode.window.showErrorMessage('Failed to switch history: ' + error),
      );
    } else {
      vscode.window.showErrorMessage('History not found: ' + historyID).then();
    }
  }

  /**
   * Get the list of conversation histories
   */
  public getHistories(): ConversationHistoryList {
    return this.histories;
  }

  /**
   * Delete a history
   * @param historyID - The ID of the history to delete
   */
  public deleteHistory(historyID: string): ConversationHistory {
    if (this.histories[historyID]) {
      const historyToDelete = this.histories[historyID];

      // Delete referenced images
      for (const entryID in historyToDelete.entries) {
        const entry = historyToDelete.entries[entryID];
        if (entry.images) {
          entry.images.forEach(async (imagePath) => {
            try {
              await fs.promises.unlink(imagePath);
            } catch (error) {
              console.error(
                `Failed to delete image: ${imagePath}, error: ${error}`,
              );
            }
          });
        }
      }

      delete this.histories[historyID];
      const newHistory = this.addNewConversationHistory();
      this.saveHistories().catch((error) =>
        vscode.window.showErrorMessage('Failed to delete history: ' + error),
      );
      return newHistory;
    } else {
      vscode.window.showErrorMessage('History not found: ' + historyID).then();
      return this.history;
    }
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
