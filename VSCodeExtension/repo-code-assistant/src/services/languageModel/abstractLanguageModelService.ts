import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConversationHistory } from '../../types/conversationHistory';
import SettingsManager from "../../api/settingsManager";

export abstract class AbstractLanguageModelService {
  protected context: vscode.ExtensionContext;
  protected historyFilePath: string | null;
  protected settingsManager: SettingsManager;

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

  protected abstract processLoadedHistory(history: ConversationHistory): void;

  public abstract getResponseForQuery(query: string): Promise<string>;
}
