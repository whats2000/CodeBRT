import { ExtensionSettings } from './extensionSettings';

export type ISettingsManager = {
  /**
   * Get all settings in the extension settings
   */
  getAllSettings(): Promise<ExtensionSettings>;

  /**
   * Get a setting in the extension settings
   * @param setting - The setting to get must be a key of ExtensionSettings
   */
  get<T extends keyof ExtensionSettings>(setting: T): ExtensionSettings[T];

  /**
   * Set a setting in the extension settings
   * @param setting - The setting to set must be a key of ExtensionSettings
   * @param value - The value to set must be of the same type as the setting
   */
  set<T extends keyof ExtensionSettings>(
    setting: T,
    value: ExtensionSettings[T],
  ): Promise<void>;
};
