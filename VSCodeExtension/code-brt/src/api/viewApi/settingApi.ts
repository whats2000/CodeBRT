import type { SettingApi } from './types';
import { SettingsManager } from '../settingsManager';

export const createSettingApi = (
  settingsManager: SettingsManager,
): SettingApi => {
  return {
    setSettingByKey: async (key, value) => {
      await settingsManager.set(key, value);
    },
    getSettingByKey: (key) => {
      return settingsManager.get(key);
    },
    getAllSettings: async () => {
      return await settingsManager.getAllSettings();
    },
  };
};
