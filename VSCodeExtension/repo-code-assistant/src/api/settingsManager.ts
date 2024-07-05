import * as vscode from 'vscode';
import {
  ExtensionSettings,
  CustomModelSettings,
  GptSoVitsVoiceSetting,
} from '../types/extensionSettings';

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
  public get<T extends keyof ExtensionSettings>(
    setting: T,
  ): ExtensionSettings[T] {
    return this.settings.get<ExtensionSettings[T]>(
      setting,
      this.defaultSettings()[setting],
    );
  }

  // Generic setter
  public set<T extends keyof ExtensionSettings>(
    setting: T,
    value: ExtensionSettings[T],
  ): Thenable<void> {
    return this.settings.update(
      setting,
      value,
      vscode.ConfigurationTarget.Global,
    );
  }

  // For Custom models
  public getCustomModels(): CustomModelSettings[] {
    return this.get('customModels') || [];
  }

  public getSelectedCustomModel(): CustomModelSettings | undefined {
    const selectedModelName = this.get('selectedCustomModel');
    return this.getCustomModels().find(
      (model) => model.name === selectedModelName,
    );
  }

  public addCustomModel(model: CustomModelSettings): void {
    const customModels = this.getCustomModels();
    customModels.push(model);
    this.set('customModels', customModels).then();
  }

  public deleteCustomModel(modelName: string): void {
    let customModels = this.getCustomModels();
    customModels = customModels.filter((m) => m.name !== modelName);
    this.set('customModels', customModels).then(() => {
      const selectedModel = this.get('selectedCustomModel');
      if (selectedModel === modelName) {
        this.set('selectedCustomModel', '').then();
      }
    });
  }

  public selectCustomModel(modelName: string): void {
    const customModels = this.getCustomModels();
    if (customModels.find((m) => m.name === modelName)) {
      this.set('selectedCustomModel', modelName).then();
    }
  }

  // For Custom voice reference settings
  public getGptSoVitsAvailableReferenceVoices(): GptSoVitsVoiceSetting[] {
    return this.get('gptSoVitsAvailableReferenceVoices') || [];
  }

  public getSelectedGptSoVitsReferenceVoice():
    | GptSoVitsVoiceSetting
    | undefined {
    const selectedVoiceName = this.get('selectedGptSoVitsReferenceVoice');
    return this.getGptSoVitsAvailableReferenceVoices().find(
      (voice) => voice.name === selectedVoiceName,
    );
  }

  public addGptSoVitsReferenceVoice(voice: GptSoVitsVoiceSetting): void {
    const voices = this.getGptSoVitsAvailableReferenceVoices();
    voices.push(voice);
    this.set('gptSoVitsAvailableReferenceVoices', voices).then();
  }

  public deleteGptSoVitsReferenceVoice(voiceName: string): void {
    let voices = this.getGptSoVitsAvailableReferenceVoices();
    voices = voices.filter((v) => v.name !== voiceName);
    this.set('gptSoVitsAvailableReferenceVoices', voices).then(() => {
      const selectedVoice = this.get('selectedGptSoVitsReferenceVoice');
      if (selectedVoice === voiceName) {
        this.set('selectedGptSoVitsReferenceVoice', '').then();
      }
    });
  }

  public selectGptSoVitsReferenceVoice(voiceName: string): void {
    const voices = this.getGptSoVitsAvailableReferenceVoices();
    if (voices.find((v) => v.name === voiceName)) {
      this.set('selectedGptSoVitsReferenceVoice', voiceName).then();
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
        ollama: false,
        custom: false,
      },
      openaiApiKey: '',
      openaiAvailableModels: ['gpt-3.5-turbo', 'gpt-4o'],
      geminiApiKey: '',
      geminiAvailableModels: [
        'gemini-1.5-pro-latest',
        'gemini-1.5-flash-latest',
      ],
      cohereApiKey: '',
      cohereAvailableModels: ['command'],
      groqApiKey: '',
      groqAvailableModels: [
        'llama3-70b-8192',
        'llama3-8b-8192',
        'mixtral-8x7b-32768',
        'gemma-7b-it',
      ],
      huggingFaceApiKey: '',
      huggingFaceAvailableModels: ['HuggingFaceH4/zephyr-7b-beta'],
      ollamaClientHost: 'http://localhost:11434',
      ollamaAvailableModels: ['llama2'],
      lastUsedModel: 'gemini',
      customModels: [],
      selectedCustomModel: '',
      gptSoVitsClientHost: '',
      gptSoVitsAvailableReferenceVoices: [],
      selectedGptSoVitsReferenceVoice: '',
      themePrimaryColor: '#f0f0f0',
      themeAlgorithm: 'darkAlgorithm',
      themeBorderRadius: 4,
    };
  }
}

export default SettingsManager;
