import * as vscode from 'vscode';

import type {
  ExtensionSettings,
  ExtensionSettingsLocal,
  ISettingsManager,
} from '../types';
import {
  DEFAULT_CROSS_DEVICE_SETTINGS,
  DEFAULT_LOCAL_SETTINGS,
  DEFAULT_SETTINGS,
  DEFAULT_WORKSPACE_SETTINGS,
} from '../constants';

export class SettingsManager implements ISettingsManager {
  private static instance: SettingsManager;
  private readonly context: vscode.ExtensionContext;
  private readonly localSettings: ExtensionSettingsLocal;
  private readonly isMissingWorkspace: boolean;
  private workspaceConfig: vscode.WorkspaceConfiguration;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
    const storedSettings = context.globalState.get<ExtensionSettingsLocal>(
      'localSettings',
      DEFAULT_LOCAL_SETTINGS,
    );
    this.localSettings = { ...DEFAULT_LOCAL_SETTINGS, ...storedSettings };
    this.isMissingWorkspace = !vscode.workspace.workspaceFolders;
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
   * Get all settings in the extension settings
   */
  public async getAllSettings(): Promise<ExtensionSettings> {
    const allKeys: Array<keyof ExtensionSettings> = Object.keys(
      DEFAULT_SETTINGS,
    ) as Array<keyof ExtensionSettings>;

    const settings: ExtensionSettings = { ...DEFAULT_SETTINGS };

    for (const key of allKeys) {
      (settings as any)[key] = this.get(key);
    }

    return {
      ...settings,
      ...this.localSettings,
    };
  }

  /**
   * Get a setting in the extension settings
   * @param setting - The setting to get must be a key of ExtensionSettings
   */
  public get<T extends keyof ExtensionSettings>(
    setting: T,
  ): ExtensionSettings[T] {
    // Check if the setting is local
    if (setting in DEFAULT_LOCAL_SETTINGS) {
      return this.localSettings[
        setting as keyof ExtensionSettingsLocal
      ] as ExtensionSettings[T];
    }
    return this.workspaceConfig.get(setting) ?? DEFAULT_SETTINGS[setting];
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
    try {
      // Check if the setting is local
      if (setting in DEFAULT_LOCAL_SETTINGS) {
        (this.localSettings as any)[setting] = value;
        await this.saveLocalSettings();
      } else if (setting in DEFAULT_WORKSPACE_SETTINGS) {
        // Check if the workspace is available
        if (this.isMissingWorkspace) {
          vscode.window
            .showWarningMessage(
              'Seems like you do not have a workspace open. ' +
                'Open a workspace to save workspace settings, use agent tools, and save conversation history.',
              'Open Workspace',
            )
            .then((selection) => {
              if (selection === 'Open Workspace') {
                vscode.commands.executeCommand('vscode.openFolder');
              }
            });
          return;
        }

        await this.workspaceConfig.update(
          setting,
          value,
          vscode.ConfigurationTarget.Workspace,
        );
      } else if (setting in DEFAULT_CROSS_DEVICE_SETTINGS) {
        await this.workspaceConfig.update(
          setting,
          value,
          vscode.ConfigurationTarget.Global,
        );
      } else {
        console.error(`Setting ${setting} not found`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to set the setting: ${setting}. ${error}`,
      );
    }
  }
}
