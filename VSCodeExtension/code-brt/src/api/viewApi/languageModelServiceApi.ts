import {
  type GetLanguageModelResponseParams,
  LanguageModelServiceApi,
} from './types';
import type { LoadedModelServices } from '../../services/languageModel/types';
import { triggerEvent } from '../registerView';
import { HistoryManager } from '../historyManager';
import { SettingsManager } from '../settingsManager';

export const createLanguageModelServiceApi = (
  models: LoadedModelServices,
  historyManager: HistoryManager,
  settingsManager: SettingsManager,
): LanguageModelServiceApi => {
  return {
    getLanguageModelResponse: async (
      options: GetLanguageModelResponseParams,
    ) => {
      return await models[options.modelServiceType].service.getResponse({
        ...options,
        historyManager,
        sendStreamResponse: options.useStream
          ? (msg) => {
              triggerEvent('streamResponse', msg);
            }
          : undefined,
        updateStatus: options.showStatus
          ? (status) => {
              triggerEvent('updateStatus', status);
            }
          : undefined,
      });
    },
    stopLanguageModelResponse: (modelServiceType) => {
      models[modelServiceType].service.stopResponse();
    },
    getAvailableModels: (modelServiceType) => {
      if (modelServiceType === 'custom') {
        return settingsManager.get('customModels').map((model) => model.name);
      }

      return settingsManager.get(`${modelServiceType}AvailableModels`);
    },
    getCurrentModel: (modelServiceType) => {
      return settingsManager.get(`lastSelectedModel`)[modelServiceType];
    },
    setAvailableModels: (modelServiceType, newAvailableModels) => {
      settingsManager
        .set(`${modelServiceType}AvailableModels`, newAvailableModels)
        .then(() => {
          models[modelServiceType].service.updateAvailableModels(
            newAvailableModels,
          );
        });
    },
    setCustomModels: (newCustomModels) => {
      settingsManager.set('customModels', newCustomModels).then(() => {
        models.custom.service.updateAvailableModels(
          newCustomModels.map((model) => model.name),
        );
      });
    },
    switchModel: (modelServiceType, modelName) => {
      models[modelServiceType].service.switchModel(modelName);
    },
    getLatestAvailableModelNames: async (modelServiceType) => {
      return await models[
        modelServiceType
      ].service.getLatestAvailableModelNames();
    },
  };
};
