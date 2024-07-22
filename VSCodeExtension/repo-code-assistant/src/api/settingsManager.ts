import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import type {
  ExtensionSettings,
  ExtensionSettingsCrossDevice,
  ExtensionSettingsLocal,
} from '../types';

export class SettingsManager {
  private static instance: SettingsManager;
  private readonly localSettingsPath: string;
  private readonly defaultLocalSettings: ExtensionSettingsLocal = {
    anthropicAvailableModels: [
      'claude-3-5-sonnet-20240620',
      'claude-3-haiku-20240307',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
    ],
    openaiAvailableModels: [
      'gpt-3.5-turbo',
      'gpt-4o',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo-instruct',
    ],
    openaiAvailableVoices: [
      'nova',
      'alloy',
      'echo',
      'fable',
      'onyx',
      'shimmer',
    ],
    openaiSelectedVoice: 'nova',
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
    lastUsedModel: 'gemini',
    lastSelectedModel: {
      gemini: 'gemini-1.5-pro-latest',
      anthropic: 'claude-3-5-sonnet-20240620',
      openai: 'gpt-3.5-turbo',
      cohere: 'command',
      groq: 'llama3-70b-8192',
      huggingFace: 'HuggingFaceH4/zephyr-7b-beta',
      ollama: 'Auto Detect',
      custom: '',
    },
    customModels: [],
    selectedVoiceToTextService: 'not set',
    selectedTextToVoiceService: 'not set',
    gptSoVitsClientHost: 'http://127.0.0.1:9880/',
    gptSoVitsAvailableReferenceVoices: [],
    gptSoVitsSelectedReferenceVoice: '',
  };
  private readonly defaultCrossDeviceSettings: ExtensionSettingsCrossDevice = {
    anthropicApiKey: '',
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
  private readonly defaultSettings: ExtensionSettings = {
    ...this.defaultLocalSettings,
    ...this.defaultCrossDeviceSettings,
  };
  private localSettings: ExtensionSettingsLocal = {
    ...this.defaultLocalSettings,
  };

  private constructor(context: vscode.ExtensionContext) {
    this.localSettingsPath = path.join(
      context.extensionPath,
      'localSettings.json',
    );

    this.loadLocalSettings();
  }

  private get settings(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('repo-code-assistant');
  }

  /**
   * Load local settings from file
   * @private
   */
  private loadLocalSettings(): void {
    if (fs.existsSync(this.localSettingsPath)) {
      const data = fs.readFileSync(this.localSettingsPath, 'utf8');
      const loadedLocalSettings = JSON.parse(data);
      this.localSettings = { ...this.localSettings, ...loadedLocalSettings };
    }
  }

  /**
   * Save local settings to file
   * @private
   */
  private saveLocalSettings(): void {
    const data = JSON.stringify(this.localSettings, null, 2);
    fs.writeFileSync(this.localSettingsPath, data, 'utf8');
  }

  /**
   * Get the instance of the SettingsManager
   * @param context - The extension context
   */
  public static getInstance(context: vscode.ExtensionContext): SettingsManager {
    if (!this.instance) {
      this.instance = new SettingsManager(context);
    }
    return this.instance;
  }

  /**
   * Get a setting in the extension settings
   * @param setting - The setting to get must be a key of ExtensionSettings
   */
  public get<T extends keyof ExtensionSettings>(
    setting: T,
  ): ExtensionSettings[T] {
    // Check if the setting is local
    if (setting in this.defaultLocalSettings) {
      return this.localSettings[
        setting as keyof ExtensionSettingsLocal
      ] as ExtensionSettings[T];
    }
    return this.settings.get<ExtensionSettings[T]>(
      setting,
      this.defaultSettings[setting],
    );
  }

  /**
   * Set a setting in the extension settings
   * @param setting - The setting to set must be a key of ExtensionSettings
   * @param value - The value to set must be of the same type as the setting
   */
  public set<T extends keyof ExtensionSettings>(
    setting: T,
    value: ExtensionSettings[T],
  ): Thenable<void> {
    // Check if the setting is local
    if (setting in this.defaultLocalSettings) {
      this.localSettings[setting as keyof ExtensionSettingsLocal] =
        value as any;

      this.saveLocalSettings();
      return Promise.resolve();
    }
    return this.settings.update(
      setting,
      value,
      vscode.ConfigurationTarget.Global,
    );
  }
}
