import vscode from 'vscode';

import type { ViewApi } from './types';
import type { LoadedModelServices } from '../../services/languageModel/types';
import type { LoadedVoiceServices } from '../../services/voice/types';
import type { PartialCodeFuser } from '../../services/partialCodeFuser';
import { SettingsManager } from '../settingsManager';
import { HistoryManager } from '../historyManager';
import { TerminalManager } from '../../integrations';
import { createContextServiceApi } from './contextServiceApi';
import { createHistoryManagerApi } from './historyManagerApi';
import { createLanguageModelServiceApi } from './languageModelServiceApi';
import { createMiscApi } from './miscApi';
import { createSettingApi } from './settingApi';
import { createVoiceServiceApi } from './voiceServiceApi';

type ViewApiFactoryParams = {
  ctx: vscode.ExtensionContext;
  settingsManager: SettingsManager;
  historyManager: HistoryManager;
  terminalManager: TerminalManager;
  partialCodeFuser: PartialCodeFuser;
  models: LoadedModelServices;
  voiceServices: LoadedVoiceServices;
  connectedViews: Partial<Record<string, vscode.WebviewView>>;
};

export const createViewApi: (options: ViewApiFactoryParams) => ViewApi = ({
  ctx,
  settingsManager,
  historyManager,
  terminalManager,
  partialCodeFuser,
  models,
  voiceServices,
  connectedViews,
}): ViewApi => {
  return {
    ...createHistoryManagerApi(historyManager),
    ...createLanguageModelServiceApi(models, historyManager, settingsManager),
    ...createMiscApi(ctx, terminalManager, partialCodeFuser, connectedViews),
    ...createSettingApi(settingsManager),
    ...createVoiceServiceApi(settingsManager, voiceServices),
    ...createContextServiceApi(),
  };
};
