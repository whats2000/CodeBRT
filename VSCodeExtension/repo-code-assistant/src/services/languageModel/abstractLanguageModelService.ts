import * as fs from 'fs';
import * as path from 'path';

import * as vscode from 'vscode';

import { ConversationHistory } from '../../types/conversationHistory';
import SettingsManager from "../../api/settingsManager";

/**
 * Abstract class for the Language Model Service
 */
export abstract class AbstractLanguageModelService {
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
   * The conversation history
   * @protected
   */
  protected history: ConversationHistory = {entries: []};

  /**
   * Constructor for the AbstractLanguageModelService
   * @param context - The extension context
   * @param historyFileName - The name of the history file
   * @param settingsManager - The settings manager
   * @protected
   */
  protected constructor(context: vscode.ExtensionContext, historyFileName: string, settingsManager: SettingsManager) {
    this.context = context;
    this.settingsManager = settingsManager;
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      if (!fs.existsSync(path.join(workspaceFolders[0].uri.fsPath, '.vscode'))) {
        fs.mkdirSync(path.join(workspaceFolders[0].uri.fsPath, '.vscode'));
      }

      this.historyFilePath = path.join(workspaceFolders[0].uri.fsPath, '.vscode', historyFileName);
    } else {
      this.historyFilePath = null;
    }
  }

  /**
   * Load the conversation history from the history file
   */
  public async loadHistory(): Promise<void> {
    if (!this.historyFilePath) {
      return;
    }
    try {
      const data = await fs.promises.readFile(this.historyFilePath, 'utf8');
      const history: ConversationHistory = JSON.parse(data);
      this.processLoadedHistory(history);
    } catch (error) {
      vscode.window.showErrorMessage('Failed to load history: ' + error);
    }
  }

  /**
   * Save the conversation history to the history file
   * @param history - The conversation history to save
   */
  public async saveHistory(history: ConversationHistory): Promise<void> {
    if (!this.historyFilePath) {
      return;
    }
    try {
      const data = JSON.stringify(history, null, 2);
      await fs.promises.writeFile(this.historyFilePath, data, 'utf8');
    } catch (error) {
      vscode.window.showErrorMessage('Failed to save history: ' + error);
    }
  }

  /**
   * Get the conversation history
   */
  public getConversationHistory(): ConversationHistory {
    return this.history;
  }

  /**
   * Clear the conversation history
   */
  public clearConversationHistory(): void {
    this.history = {entries: []};
    this.saveHistory(this.history).catch(
      (error) => vscode.window.showErrorMessage('Failed to clear conversation history: ' + error)
    );
  }

  /**
   * Post process the loaded history, this will be called after the history is loaded
   * @param history - The loaded history
   * @protected
   */
  protected abstract processLoadedHistory(history: ConversationHistory): void;

  /**
   * Get the response for a query
   * @param query - The query to get a response for
   */
  public abstract getResponseForQuery(query: string): Promise<string>;
}
