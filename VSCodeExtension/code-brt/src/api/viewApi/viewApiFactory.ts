import vscode from 'vscode';

import type { ViewApi } from './types';
import type { LoadedModelServices } from '../../services/languageModel/types';
import type { LoadedVoiceServices } from '../../services/voice/types';
import { SettingsManager } from '../settingsManager';
import { HistoryManager } from '../historyManager';
import { TerminalManager } from '../../integrations';
import { OpenaiCodeFixerService } from '../../services/codeFixer';
import { DiffViewProvider } from '../../diff';
import { createHistoryManagerApi } from './historyManagerApi';
import { createLanguageModelServiceApi } from './languageModelServiceApi';
import { createMiscApi } from './miscApi';
import { createSettingApi } from './settingApi';
import { createVoiceServiceApi } from './voiceServiceApi';
import { createCodeFixerApi } from './codeFixerApi';

export const createViewApi: (
  ctx: vscode.ExtensionContext,
  settingsManager: SettingsManager,
  historyManager: HistoryManager,
  terminalManager: TerminalManager,
  models: LoadedModelServices,
  loadedVoiceServices: LoadedVoiceServices,
  connectedViews: Partial<Record<string, vscode.WebviewView>>,
  openaiCodeFixerService: OpenaiCodeFixerService,
  diffViewProvider: DiffViewProvider,
) => ViewApi = (
  ctx,
  settingsManager,
  historyManager,
  terminalManager,
  models,
  loadedVoiceServices,
  connectedViews,
  openaiCodeFixerService,
  diffViewProvider,
) => {
  return {
    ...createCodeFixerApi(
      openaiCodeFixerService,
      diffViewProvider,
      connectedViews,
    ),
    ...createHistoryManagerApi(historyManager),
    ...createLanguageModelServiceApi(models, historyManager, settingsManager),
    ...createMiscApi(ctx, terminalManager, connectedViews),
    ...createSettingApi(settingsManager),
    ...createVoiceServiceApi(settingsManager, loadedVoiceServices),
  };
};
