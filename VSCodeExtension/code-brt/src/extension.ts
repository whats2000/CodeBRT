import * as vscode from 'vscode';

import {
  AVAILABLE_MODEL_SERVICES,
  AVAILABLE_VOICE_SERVICES,
} from './constants';
import {
  connectedViews,
  HistoryManager,
  registerAndConnectView,
  registerDiff,
  registerInlineCompletion,
  SettingsManager,
} from './api';
import { ModelServiceFactory } from './services/languageModel';
import { VoiceServiceFactory } from './services/voice';
import { DiffIntegration, TerminalManager } from './integrations';
import { createViewApi } from './api/viewApi/viewApiFactory';

let extensionContext: vscode.ExtensionContext | undefined = undefined;

export const activate = async (ctx: vscode.ExtensionContext) => {
  extensionContext = ctx;
  const settingsManager = SettingsManager.getInstance(ctx);
  const historyManager = new HistoryManager(ctx);
  const terminalManager = new TerminalManager();
  const diffIntegration = new DiffIntegration(ctx);

  // Create a model service factory instance
  const modelServiceFactory = new ModelServiceFactory(ctx, settingsManager);
  const models = modelServiceFactory.createModelServices(
    AVAILABLE_MODEL_SERVICES,
  );
  const voiceServiceFactory = new VoiceServiceFactory(ctx, settingsManager);
  const voiceServices = voiceServiceFactory.createVoiceServices(
    AVAILABLE_VOICE_SERVICES,
  );

  /**
   * Register and connect views to the extension
   * This uses for communication messages channel
   */
  const api = createViewApi(
    ctx,
    settingsManager,
    historyManager,
    terminalManager,
    models,
    voiceServices,
    connectedViews,
  );

  void registerAndConnectView(ctx, settingsManager, 'chatActivityBar', api);
  void registerAndConnectView(ctx, settingsManager, 'workPanel', api);
  registerInlineCompletion(ctx, settingsManager, connectedViews);
  registerDiff(ctx, diffIntegration);
};

export const deactivate = () => {
  extensionContext?.subscriptions?.forEach((sub) => sub.dispose());
};
