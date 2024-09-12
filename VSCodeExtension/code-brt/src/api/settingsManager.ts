import * as vscode from 'vscode';

import type {
  ExtensionSettings,
  ExtensionSettingsCrossDevice,
  ExtensionSettingsLocal,
  ExtensionSettingsWorkspace,
} from '../types';

export class SettingsManager {
  private static instance: SettingsManager;
  private readonly context: vscode.ExtensionContext;
  private workspaceConfig: vscode.WorkspaceConfiguration;
  private readonly defaultLocalSettings: ExtensionSettingsLocal = {
    anthropicAvailableModels: [
      'claude-3-5-sonnet-20240620',
      'claude-3-haiku-20240307',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
    ],
    openaiAvailableModels: [
      'gpt-4o-mini',
      'gpt-4o',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
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
    lastUsedModelService: 'gemini',
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
    enableTools: {
      webSearch: { active: true },
      urlFetcher: { active: true },
    },
    systemPrompts: [],
    retainContextWhenHidden: false,
  };
  private readonly defaultWorkspaceSettings: ExtensionSettingsWorkspace = {
    lastUsedHistoryID: '',
  };
  private readonly defaultCrossDeviceSettings: ExtensionSettingsCrossDevice = {
    anthropicApiKey: '',
    openaiApiKey: '',
    geminiApiKey: '',
    cohereApiKey: '',
    groqApiKey: '',
    huggingFaceApiKey: '',
    doubleEnterSendMessages: false,
    themePrimaryColor: '#f0f0f0',
    themeAlgorithm: 'darkAlgorithm',
    themeBorderRadius: 4,
    hljsTheme: 'darcula',
  };
  private readonly defaultSettings: ExtensionSettings = {
    ...this.defaultLocalSettings,
    ...this.defaultWorkspaceSettings,
    ...this.defaultCrossDeviceSettings,
  };
  private readonly localSettings: ExtensionSettingsLocal;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
    const storedSettings = context.globalState.get<ExtensionSettingsLocal>(
      'localSettings',
      this.defaultLocalSettings,
    );
    this.localSettings = { ...this.defaultLocalSettings, ...storedSettings };
    this.workspaceConfig = vscode.workspace.getConfiguration('code-brt');

    vscode.workspace.onDidChangeConfiguration(
      this.onConfigurationChange,
      this,
      context.subscriptions,
    );
  }

  private onConfigurationChange(event: vscode.ConfigurationChangeEvent): void {
    if (event.affectsConfiguration('code-brt')) {
      this.workspaceConfig = vscode.workspace.getConfiguration('code-brt');
    }
  }

  /**
   * Save local settings to file
   * @private
   */
  private async saveLocalSettings(): Promise<void> {
    await this.context.globalState.update('localSettings', this.localSettings);
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
    return this.workspaceConfig.get(setting) ?? this.defaultSettings[setting];
  }

  /**
   * Set a setting in the extension settings
   * @param setting - The setting to set must be a key of ExtensionSettings
   * @param value - The value to set must be of the same type as the setting
   */
  public async set<T extends keyof ExtensionSettings>(
    setting: T,
    value: ExtensionSettings[T],
  ): Promise<void> {
    // Check if the setting is local
    if (setting in this.defaultLocalSettings) {
      (this.localSettings as any)[setting] = value;
      await this.saveLocalSettings();
    } else if (setting in this.defaultWorkspaceSettings) {
      await this.workspaceConfig.update(
        setting,
        value,
        vscode.ConfigurationTarget.Workspace,
      );
    } else {
      await this.workspaceConfig.update(
        setting,
        value,
        vscode.ConfigurationTarget.Global,
      );
    }
  }
}
