import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidV4 } from 'uuid';
import * as vscode from 'vscode';

import type {
  ConversationEntry,
  ConversationHistory,
  ConversationHistoryIndex,
  ConversationHistoryIndexList,
  ConversationModelAdvanceSettings,
  IHistoryManager,
  ModelServiceType,
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
    this.loadHistoryIndexes().catch((error) =>
      vscode.window.showErrorMessage('Failed to load histories: ' + error),
    );
  }

  /**
   * Load the conversation history index from the index file
   */
  private async loadHistoryIndexes(): Promise<void> {
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
   * Get the default empty conversation history
   */
  private getDefaultConversationHistory(): ConversationHistory {
    return {
      root: uuidV4(),
      top: [],
      current: '',
      create_time: Date.now(),
      update_time: Date.now(),
      advanceSettings: {
        systemPrompt: 'You are a helpful assistant.',
        maxTokens: undefined,
        temperature: undefined,
        topP: undefined,
        topK: undefined,
        presencePenalty: undefined,
        frequencyPenalty: undefined,
      },
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
    // Prevent saving the empty history
    if (
      !this.historiesFolderPath ||
      Object.keys(history.entries).length === 0
    ) {
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
   * Load a single conversation history by its ID
   */
  private async loadHistoryById(
    historyId: string,
  ): Promise<ConversationHistory> {
    if (!this.historiesFolderPath) {
      return this.getDefaultConversationHistory();
    }
    const filePath = path.join(this.historiesFolderPath, `${historyId}.json`);
    if (!fs.existsSync(filePath)) {
      vscode.window.showErrorMessage('History file not found: ' + historyId);
      return this.getDefaultConversationHistory();
    }
    try {
      const data = await fs.promises.readFile(filePath, 'utf8');
      return {
        ...this.getDefaultConversationHistory(),
        ...JSON.parse(data),
      };
    } catch (error) {
      vscode.window.showErrorMessage('Failed to load history: ' + error);
      return this.getDefaultConversationHistory();
    }
  }

  public getCurrentHistory(): ConversationHistory {
    return this.history;
  }

  public getHistoryBeforeEntry(currentEntryID?: string): ConversationHistory {
    if (!currentEntryID) return this.history;

    const newHistory: ConversationHistory = {
      root: this.history.root,
      top: this.history.top,
      current: currentEntryID,
      create_time: this.history.create_time,
      update_time: Date.now(),
      advanceSettings: this.history.advanceSettings,
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

  public async addNewConversationHistory(): Promise<ConversationHistory> {
    const newHistory: ConversationHistory =
      this.getDefaultConversationHistory();
    newHistory.advanceSettings.systemPrompt =
      this.history.advanceSettings.systemPrompt;
    this.history = newHistory;
    return newHistory;
  }

  public async addConversationEntry(
    parentID: string | null,
    role: 'user' | 'AI',
    message: string,
    images?: string[],
    modelServiceType?: ModelServiceType,
  ): Promise<ConversationEntry> {
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
        vscode.window.showErrorMessage('Parent entry not found: ' + parentID);
        return newEntry;
      }
      this.history.entries[parentID].children.push(newID);
    } else {
      this.history.top.push(newID);
    }

    this.history.entries[newID] = newEntry;
    this.history.update_time = Date.now();
    this.history.current = newID;

    // Check if this is a new conversation that needs to be saved
    if (!this.historyIndex[this.history.root]) {
      this.historyIndex[this.history.root] = {
        id: this.history.root,
        title: `${message.substring(0, 50)}`,
        create_time: this.history.create_time,
        update_time: this.history.update_time,
      };
    } else {
      this.historyIndex[this.history.root].update_time =
        this.history.update_time;
    }

    await this.saveHistoryById(this.history).catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to add conversation entry: ' + error,
      ),
    );

    // Add tag to history if it's not already there
    if (
      !(
        !this.historyIndex[this.history.root].tags?.includes(
          modelServiceType || '',
        ) && modelServiceType
      )
    ) {
      await this.saveHistoryIndex().catch((error) =>
        vscode.window.showErrorMessage(
          'Failed to save history index: ' + error,
        ),
      );
    } else {
      await this.addTagToHistory(this.history.root, modelServiceType);
    }

    return newEntry;
  }

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
      vscode.window.showErrorMessage('Entry not found: ' + entryID);
    }
  }

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
      vscode.window.showErrorMessage('History not found: ' + historyID);
    }
  }

  public async switchHistory(historyID: string): Promise<ConversationHistory> {
    if (this.historyIndex[historyID]) {
      await this.saveHistoryById(this.history).catch((error) =>
        vscode.window.showErrorMessage(
          'Failed to save current history: ' + error,
        ),
      );
      this.history = await this.loadHistoryById(historyID);
      return this.history;
    } else {
      return this.history;
    }
  }

  public getHistoryIndexes(): ConversationHistoryIndexList {
    return this.historyIndex;
  }

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
      vscode.window.showErrorMessage('History not found: ' + historyID);
      return this.history;
    }
  }

  public async addTagToHistory(historyID: string, tag: string): Promise<void> {
    if (!this.historyIndex[historyID].tags) {
      this.historyIndex[historyID].tags = [];
    }
    if (this.historyIndex[historyID].tags.includes(tag)) {
      return;
    }
    this.historyIndex[historyID].tags.push(tag);
    await this.saveHistoryIndex().catch((error) =>
      vscode.window.showErrorMessage('Failed to save history index: ' + error),
    );
  }

  public async removeTagFromHistory(
    historyID: string,
    tag: string,
  ): Promise<void> {
    if (this.historyIndex[historyID].tags) {
      this.historyIndex[historyID].tags = this.historyIndex[
        historyID
      ].tags.filter((t) => t !== tag);
    }
    await this.saveHistoryIndex().catch((error) =>
      vscode.window.showErrorMessage('Failed to save history index: ' + error),
    );
  }

  public async updateHistoryModelAdvanceSettings(
    historyID: string,
    advanceSettings: ConversationModelAdvanceSettings,
  ): Promise<void> {
    // Prevent updating the advance settings if the history got swapped
    if (this.history.root !== historyID) return;

    this.history.advanceSettings = advanceSettings;

    // Only save the history when it's created otherwise only store in memory
    if (this.historyIndex[historyID]) {
      await this.saveHistoryById(this.history).catch((error) =>
        vscode.window.showErrorMessage(
          'Failed to update model advance settings: ' + error,
        ),
      );
    }
  }
}
