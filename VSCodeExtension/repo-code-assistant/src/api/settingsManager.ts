import * as vscode from 'vscode';
import { ExtensionSettings, CustomModelSettings } from '../types/extensionSettings';

class SettingsManager {
  private static instance: SettingsManager;

  public static getInstance(): SettingsManager {
    if (!this.instance) {
      this.instance = new SettingsManager();
    }
    return this.instance;
  }

  private get settings(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('repo-code-assistant');
  }

  // Generic getter
  public get<T extends keyof ExtensionSettings>(setting: T): ExtensionSettings[T] {
    return this.settings.get<ExtensionSettings[T]>(setting, this.defaultSettings()[setting]);
  }

  // Generic setter
  public set<T extends keyof ExtensionSettings>(setting: T, value: ExtensionSettings[T]): Thenable<void> {
    return this.settings.update(setting, value, vscode.ConfigurationTarget.Global);
  }

  // Custom models
  public getCustomModels(): CustomModelSettings[] {
    return this.get('customModels') || [];
  }

  public getSelectedCustomModel(): CustomModelSettings | undefined {
    const selectedModelName = this.get('selectedCustomModel');
    return this.getCustomModels().find(model => model.name === selectedModelName);
  }

  public addCustomModel(model: CustomModelSettings): void {
    const customModels = this.getCustomModels();
    customModels.push(model);
    this.set('customModels', customModels);
  }

  public updateCustomModel(model: CustomModelSettings): void {
    const customModels = this.getCustomModels();
    const index = customModels.findIndex(m => m.name === model.name);
    if (index !== -1) {
      customModels[index] = model;
      this.set('customModels', customModels);
    }
  }

  public deleteCustomModel(modelName: string): void {
    let customModels = this.getCustomModels();
    customModels = customModels.filter(m => m.name !== modelName);
    this.set('customModels', customModels);

    const selectedModel = this.get('selectedCustomModel');
    if (selectedModel === modelName) {
      this.set('selectedCustomModel', '');
    }
  }

  public selectCustomModel(modelName: string): void {
    const customModels = this.getCustomModels();
    if (customModels.find(m => m.name === modelName)) {
      this.set('selectedCustomModel', modelName);
    }
  }

  // Default settings values
  private defaultSettings(): ExtensionSettings {
    return {
      enableModel: {
        gemini: false,
        openai: false,
        cohere: false,
        groq: false,
        huggingFace: false,
        custom: false,
      },
      openAiApiKey: '',
      geminiApiKey: '',
      cohereApiKey: '',
      groqApiKey: '',
      huggingFaceApiKey: '',
      lastUsedModel: 'gemini',
      customModels: [],
      selectedCustomModel: '',
    };
  }
}

export default SettingsManager;
