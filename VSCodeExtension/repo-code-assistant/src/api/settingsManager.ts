import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import type {
  ExtensionSettings,
  CustomModelSettings,
  GptSoVitsVoiceSetting,
} from '../types';

class SettingsManager {
  private static instance: SettingsManager;
  private readonly localSettingsPath: string;

  private constructor(context: vscode.ExtensionContext) {
    this.localSettingsPath = path.join(
      context.extensionPath,
      'localSettings.json',
    );
    this.loadLocalSettings();
  }

  public static getInstance(context: vscode.ExtensionContext): SettingsManager {
    if (!this.instance) {
      this.instance = new SettingsManager(context);
    }
    return this.instance;
  }

  private get settings(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('repo-code-assistant');
  }

  private localSettings: Partial<ExtensionSettings> = {
    openaiAvailableModels: [
      'gpt-3.5-turbo',
      'gpt-4o',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo-instruct',
    ],
    geminiAvailableModels: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'],
    cohereAvailableModels: ['command', 'command-r', 'command-r-plus'],
    groqAvailableModels: [
      'llama3-70b-8192',
      'llama3-8b-8192',
      'mixtral-8x7b-32768',
      'gemma-7b-it',
      'gemma2-9b-it',
    ],
    huggingFaceAvailableModels: ['HuggingFaceH4/zephyr-7b-beta'],
    ollamaClientHost: 'http://127.0.0.1:11434',
    ollamaAvailableModels: ['Auto Detect'],
    customModels: [],
    selectedCustomModel: '',
    selectedVoiceToTextService: 'not set',
    selectedTextToVoiceService: 'not set',
    gptSoVitsClientHost: 'http://127.0.0.1:9880/',
    gptSoVitsAvailableReferenceVoices: [],
    selectedGptSoVitsReferenceVoice: '',
    lastUsedModel: 'gemini',
  };

  // Load local settings from file
  private loadLocalSettings(): void {
    if (fs.existsSync(this.localSettingsPath)) {
      const data = fs.readFileSync(this.localSettingsPath, 'utf8');
      this.localSettings = JSON.parse(data);
    }
  }

  // Save local settings to file
  private saveLocalSettings(): void {
    const data = JSON.stringify(this.localSettings, null, 2);
    fs.writeFileSync(this.localSettingsPath, data, 'utf8');
  }

  // Generic getter
  public get<T extends keyof ExtensionSettings>(
    setting: T,
  ): ExtensionSettings[T] {
    // Check if the setting is local
    if (this.isLocalSetting(setting)) {
      return this.localSettings[setting] as ExtensionSettings[T];
    }
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
    // Check if the setting is local
    if (this.isLocalSetting(setting)) {
      this.localSettings[setting] = value;
      this.saveLocalSettings();
      return Promise.resolve();
    }
    return this.settings.update(
      setting,
      value,
      vscode.ConfigurationTarget.Global,
    );
  }

  // Check if a setting should be local
  private isLocalSetting<T extends keyof ExtensionSettings>(
    setting: T,
  ): boolean {
    const crossDeviceSettingsKeys: (keyof ExtensionSettings)[] = [
      'openaiApiKey',
      'geminiApiKey',
      'cohereApiKey',
      'groqApiKey',
      'huggingFaceApiKey',
      'themePrimaryColor',
      'themeAlgorithm',
      'themeBorderRadius',
      'hljsTheme',
    ];
    return !crossDeviceSettingsKeys.includes(setting);
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

  public selectGptSoVitsReferenceVoice(voiceName: string): void {
    const voices = this.getGptSoVitsAvailableReferenceVoices();
    if (voices.find((v) => v.name === voiceName)) {
      this.set('selectedGptSoVitsReferenceVoice', voiceName).then();
    }
  }

  // Default settings values
  private defaultSettings(): ExtensionSettings {
    return {
      // Local Settings
      openaiAvailableModels: [
        'gpt-3.5-turbo',
        'gpt-4o',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo-instruct',
      ],
      geminiAvailableModels: [
        'gemini-1.5-pro-latest',
        'gemini-1.5-flash-latest',
      ],
      cohereAvailableModels: ['command', 'command-r', 'command-r-plus'],
      groqAvailableModels: [
        'llama3-70b-8192',
        'llama3-8b-8192',
        'mixtral-8x7b-32768',
        'gemma-7b-it',
        'gemma2-9b-it',
      ],
      huggingFaceAvailableModels: ['HuggingFaceH4/zephyr-7b-beta'],
      ollamaClientHost: 'http://127.0.0.1:11434',
      ollamaAvailableModels: ['Auto Detect'],
      lastUsedModel: 'gemini',
      customModels: [],
      selectedCustomModel: '',
      selectedVoiceToTextService: 'not set',
      selectedTextToVoiceService: 'not set',
      gptSoVitsClientHost: 'http://127.0.0.1:9880/',
      gptSoVitsAvailableReferenceVoices: [],
      selectedGptSoVitsReferenceVoice: '',
      // Cross-Device Sync Settings
      openaiApiKey: '',
      geminiApiKey: '',
      cohereApiKey: '',
      groqApiKey: '',
      huggingFaceApiKey: '',
      themePrimaryColor: '#f0f0f0',
      themeAlgorithm: 'darkAlgorithm',
      themeBorderRadius: 4,
      hljsTheme: 'darcula',
    };
  }
}

export default SettingsManager;
