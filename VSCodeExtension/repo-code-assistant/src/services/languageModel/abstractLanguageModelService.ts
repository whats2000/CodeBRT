import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import * as vscode from 'vscode';

import {
  ConversationHistory,
  ConversationEntry,
  ConversationHistoryList,
} from '../../types/conversationHistory';
import SettingsManager from '../../api/settingsManager';
import { LanguageModelService } from '../../types/languageModelService';

/**
 * Abstract class for the Language Model Service
 */
export abstract class AbstractLanguageModelService
  implements LanguageModelService
{
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
  protected history: ConversationHistory = {
    title: '',
    root: '',
    current: '',
    create_time: Date.now(),
    update_time: Date.now(),
    entries: {},
  };

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
  protected availableModelName: string[] = [];

  /**
   * Constructor for the AbstractLanguageModelService
   * @param context - The extension context
   * @param historyFileName - The name of the history file
   * @param settingsManager - The settings manager
   * @param currentModel - The current in-use model
   * @param availableModelName - The list of available model names
   * @protected
   */
  protected constructor(
    context: vscode.ExtensionContext,
    historyFileName: string,
    settingsManager: SettingsManager,
    currentModel: string,
    availableModelName: string[],
  ) {
    this.context = context;
    this.settingsManager = settingsManager;
    this.currentModel = currentModel;
    this.availableModelName = availableModelName;

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
    const newHistory: ConversationHistory = {
      title: '',
      root: '',
      current: '',
      create_time: Date.now(),
      update_time: Date.now(),
      entries: {},
    };

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
    const newID = uuidv4();
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
    }

    if (this.history.root === '') {
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
   * Get the history before a given entry id
   * @param currentEntryID - The entry id to get the history before
   * @returns The conversation history before the given entry id
   */
  protected getHistoryBeforeEntry(currentEntryID: string): ConversationHistory {
    const newHistory: ConversationHistory = {
      title: this.history.title,
      root: this.history.root,
      current: currentEntryID,
      create_time: this.history.create_time,
      update_time: Date.now(),
      entries: {},
    };

    let currentEntry = this.history.entries[currentEntryID];
    const entryStack: ConversationEntry[] = [];

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
              vscode.window.showErrorMessage(
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
   * Get the available models
   */
  public getAvailableModels(): string[] {
    return this.availableModelName;
  }

  /**
   * Switch to a different model
   * @param newModel - The name of the model to switch to
   */
  public switchModel(newModel: string): void {
    if (this.availableModelName.includes(newModel)) {
      this.currentModel = newModel;
      vscode.window
        .showInformationMessage(`Switched to model: ${newModel}`)
        .then();
    } else {
      vscode.window
        .showErrorMessage(`Model ${newModel} is not available.`)
        .then();
    }
  }

  /**
   * Post process the loaded history, this will be called after the history is loaded
   * @param history - The loaded history
   * @protected
   */
  protected abstract processLoadedHistory(history: ConversationHistory): void;

  /**
   * Get the response for a query, if the currentEntryID is provided, the history will be used from that point
   * @param query - The query to get a response for
   * @param currentEntryID - The current entry ID
   * @returns The response for the query
   */
  public abstract getResponseForQuery(
    query: string,
    currentEntryID?: string,
  ): Promise<string>;

  /**
   * Get the response for a query and also fire a view event to send the response in chunks.
   * If the currentEntryID is provided, the history will be used from that point
   * @param query - The query to get a response for
   * @param sendStreamResponse - The callback to send chunks of the response to
   * @param currentEntryID - The current entry ID
   * @returns The response for the query
   */
  public abstract getResponseChunksForQuery(
    query: string,
    sendStreamResponse: (msg: string) => void,
    currentEntryID?: string,
  ): Promise<string>;

  public async getResponseChunksForQueryWithImage(
    _query: string,
    _images: string[],
    _sendStreamResponse: (msg: string) => void,
  ): Promise<string> {
    vscode.window
      .showInformationMessage(
        'This feature is not supported by the current model.',
      )
      .then();

    return 'This feature is not supported by the current model.';
  }
}
