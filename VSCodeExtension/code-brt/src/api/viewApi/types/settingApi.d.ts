import { ExtensionSettings } from '../../../types';

export type SettingApi = {
  /**
   * Set the target setting of the extension.
   * @param key - The key of the setting to set.
   * @param value - The new value of the setting.
   * @returns A promise that resolves when the setting is updated.
   */
  setSettingByKey: (
    key: keyof ExtensionSettings,
    value: ExtensionSettings[typeof key],
  ) => Promise<void>;

  /**
   * Get the target setting of the extension.
   * @param key - The key of the setting to get.
   * @returns The value of the setting.
   */
  getSettingByKey: (
    key: keyof ExtensionSettings,
  ) => ExtensionSettings[typeof key];

  /**
   * Get all settings of the extension.
   * @returns The settings of the extension.
   */
  getAllSettings: () => Promise<ExtensionSettings>;
};
