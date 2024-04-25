import * as vscode from 'vscode';
import { ExtensionSettings } from '../types/extensionSettings';

class SettingsManager {
  private static instance: SettingsManager;
  private settings: vscode.WorkspaceConfiguration;

  private constructor() {
    this.settings = vscode.workspace.getConfiguration('repo-code-assistant');
  }

  public static getInstance(): SettingsManager {
    if (!this.instance) {
      this.instance = new SettingsManager();
    }
    return this.instance;
  }

  // Generic getter
  public get<T extends keyof ExtensionSettings>(setting: T): ExtensionSettings[T] {
    return this.settings.get<ExtensionSettings[T]>(setting, this.defaultSettings()[setting]);
  }

  // Generic setter
  public set<T extends keyof ExtensionSettings>(setting: T, value: ExtensionSettings[T]): Thenable<void> {
    return this.settings.update(setting, value, vscode.ConfigurationTarget.Global);
  }

  // Default settings values
  private defaultSettings(): ExtensionSettings {
    return {
      geminiApiKey: '',
    };
  }
}

export default SettingsManager;
