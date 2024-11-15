import vscode from 'vscode';

import type { ViewApi } from './types';
import type { LoadedModelServices } from '../../services/languageModel/types';
import type { LoadedVoiceServices } from '../../services/voice/types';
import { SettingsManager } from '../settingsManager';
import { HistoryManager } from '../historyManager';
import { TerminalManager } from '../../integrations';
import { createHistoryManagerApi } from './historyManagerApi';
import { createLanguageModelServiceApi } from './languageModelServiceApi';
import { createMiscApi } from './miscApi';
import { createSettingApi } from './settingApi';
import { createVoiceServiceApi } from './voiceServiceApi';

export const createViewApi: (
  ctx: vscode.ExtensionContext,
  settingsManager: SettingsManager,
  historyManager: HistoryManager,
  terminalManager: TerminalManager,
  models: LoadedModelServices,
  loadedVoiceServices: LoadedVoiceServices,
  connectedViews: Partial<Record<string, vscode.WebviewView>>,
) => ViewApi = (
  ctx,
  settingsManager,
  historyManager,
  terminalManager,
  models,
  loadedVoiceServices,
  connectedViews,
) => {
  return {
    ...createHistoryManagerApi(historyManager),
    ...createLanguageModelServiceApi(models, historyManager, settingsManager),
    ...createMiscApi(ctx, terminalManager, connectedViews),
    ...createSettingApi(settingsManager),
    ...createVoiceServiceApi(settingsManager, loadedVoiceServices),
  };
};
