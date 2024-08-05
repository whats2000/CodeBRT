import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidV4 } from 'uuid';
import * as vscode from 'vscode';

import type {
  ConversationEntry,
  ConversationHistory,
  ConversationHistoryIndex,
  IHistoryManager,
} from '../types';

export class HistoryManager implements IHistoryManager {
  private readonly historiesFolderPath: string;
  private readonly historyIndexFilePath: string | null;
  private history: ConversationHistory = this.getDefaultConversationHistory();
  private historyIndex: { [key: string]: ConversationHistoryIndex } = {};

  constructor(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      const vscodePath = path.join(workspaceFolders[0].uri.fsPath, '.vscode');
      if (!fs.existsSync(vscodePath)) {
        fs.mkdirSync(vscodePath);
      }

      this.historyIndexFilePath = path.join(vscodePath, 'historyIndex.json');
      this.historiesFolderPath = path.join(vscodePath, 'histories');
      if (!fs.existsSync(this.historiesFolderPath)) {
        fs.mkdirSync(this.historiesFolderPath);
      }
    } else {
      // Use Global Storage
      const extensionPath = context.extensionPath;
      this.historyIndexFilePath = path.join(extensionPath, 'historyIndex.json');
      this.historiesFolderPath = path.join(extensionPath, 'histories');
      if (!fs.existsSync(this.historiesFolderPath)) {
        fs.mkdirSync(this.historiesFolderPath);
      }
    }

    // Load the conversation history index
    this.loadHistories().catch((error) =>
      vscode.window.showErrorMessage('Failed to load histories: ' + error),
    );
  }

  /**
   * Get the default empty conversation history
   */
  private getDefaultConversationHistory(): ConversationHistory {
    return {
      root: uuidV4(),
      title: '',
      top: [],
      current: '',
      create_time: Date.now(),
      update_time: Date.now(),
      entries: {},
    };
  }

  /**
   * Save the conversation history index to the index file
   */
  private async saveHistoryIndex(): Promise<void> {
    if (!this.historyIndexFilePath) {
      return;
    }
    try {
      const data = JSON.stringify(this.historyIndex, null, 2);
      await fs.promises.writeFile(this.historyIndexFilePath, data, 'utf8');
    } catch (error) {
      vscode.window.showErrorMessage('Failed to save history index: ' + error);
    }
  }

  /**
   * Save a single conversation history by its ID
   */
  private async saveHistoryById(history: ConversationHistory): Promise<void> {
    if (!this.historiesFolderPath) {
      return;
    }
    try {
      const filePath = path.join(
        this.historiesFolderPath,
        `${history.root}.json`,
      );
      const data = JSON.stringify(history, null, 2);
      await fs.promises.writeFile(filePath, data, 'utf8');
    } catch (error) {
      vscode.window.showErrorMessage('Failed to save history: ' + error);
    }
  }

  /**
   * Load the conversation history index from the index file
   */
  private async loadHistories(): Promise<void> {
    if (!this.historyIndexFilePath) {
      return;
    }
    if (!fs.existsSync(this.historyIndexFilePath)) {
      return;
    }
    try {
      const data = await fs.promises.readFile(
        this.historyIndexFilePath,
        'utf8',
      );
      this.historyIndex = JSON.parse(data);
    } catch (error) {
      vscode.window.showErrorMessage('Failed to load history index: ' + error);
    }
  }

  /**
   * Load a single conversation history by its ID
   */
  private async loadHistoryById(historyId: string): Promise<void> {
    if (!this.historiesFolderPath) {
      return;
    }
    const filePath = path.join(this.historiesFolderPath, `${historyId}.json`);
    if (!fs.existsSync(filePath)) {
      vscode.window.showErrorMessage('History file not found: ' + historyId);
      return;
    }
    try {
      const data = await fs.promises.readFile(filePath, 'utf8');
      this.history = JSON.parse(data);
    } catch (error) {
      vscode.window.showErrorMessage('Failed to load history: ' + error);
    }
  }

  public getHistoryBeforeEntry(currentEntryID?: string): ConversationHistory {
    if (!currentEntryID) return this.history;

    const newHistory: ConversationHistory = {
      root: uuidV4(),
      title: this.history.title,
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

  /**
   * Add a new conversation history
   */
  public async addNewConversationHistory(): Promise<ConversationHistory> {
    const newHistory: ConversationHistory =
      this.getDefaultConversationHistory();
    const newHistoryId = newHistory.root;

    this.historyIndex[newHistoryId] = {
      id: newHistoryId,
      title: newHistory.title,
      create_time: newHistory.create_time,
      update_time: newHistory.update_time,
    };
    this.history = newHistory;

    await this.saveHistoryIndex().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to add new conversation history: ' + error,
      ),
    );
    await this.saveHistoryById(newHistory).catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to save new conversation history: ' + error,
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
  public async addConversationEntry(
    parentID: string | null,
    role: 'user' | 'AI',
    message: string,
    images?: string[],
  ): Promise<string> {
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

    this.history.entries[newID] = newEntry;
    this.history.update_time = Date.now();
    this.history.current = newID;
    await this.saveHistoryById(this.history).catch((error) =>
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
  public async editConversationEntry(
    entryID: string,
    newMessage: string,
  ): Promise<void> {
    if (this.history.entries[entryID]) {
      this.history.entries[entryID].message = newMessage;
      this.history.update_time = Date.now();
      await this.saveHistoryById(this.history).catch((error) =>
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
  public async updateHistoryTitleById(
    historyID: string,
    newTitle: string,
  ): Promise<void> {
    if (this.historyIndex[historyID]) {
      this.historyIndex[historyID].title = newTitle;
      this.historyIndex[historyID].update_time = Date.now();
      await this.saveHistoryIndex().catch((error) =>
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
  public async switchHistory(historyID: string): Promise<void> {
    if (this.historyIndex[historyID]) {
      await this.loadHistoryById(historyID);
      await this.saveHistoryById(this.history).catch((error) =>
        vscode.window.showErrorMessage('Failed to switch history: ' + error),
      );
    } else {
      vscode.window.showErrorMessage('History not found: ' + historyID).then();
    }
  }

  /**
   * Get the list of conversation histories
   */
  public getHistories(): { [key: string]: ConversationHistoryIndex } {
    return this.historyIndex;
  }

  /**
   * Delete a history
   * @param historyID - The ID of the history to delete
   */
  public async deleteHistory(historyID: string): Promise<ConversationHistory> {
    if (this.historyIndex[historyID]) {
      const filePath = path.join(this.historiesFolderPath, `${historyID}.json`);
      fs.promises
        .unlink(filePath)
        .catch((error) =>
          vscode.window.showErrorMessage(
            'Failed to delete history file: ' + error,
          ),
        );

      delete this.historyIndex[historyID];
      await this.saveHistoryIndex().catch((error) =>
        vscode.window.showErrorMessage(
          'Failed to delete history index: ' + error,
        ),
      );

      return await this.addNewConversationHistory();
    } else {
      vscode.window.showErrorMessage('History not found: ' + historyID).then();
      return this.history;
    }
  }
}
