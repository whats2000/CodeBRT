import * as vscode from 'vscode';

import {
  AVAILABLE_MODEL_SERVICES,
  AVAILABLE_VOICE_SERVICES,
} from './constants';
import {
  connectedViews,
  HistoryManager,
  registerAndConnectView,
  registerInlineCompletion,
  SettingsManager,
} from './api';
import { ModelServiceFactory } from './services/languageModel';
import { VoiceServiceFactory } from './services/voice';
import { OpenaiCodeFixerService } from './services/codeFixer';
import { TerminalManager } from './integrations';
import { createViewApi } from './api/viewApi/viewApiFactory';
import { DiffViewProvider } from './diff';
import { registerCodeActions } from './api/registerCodeActions';

let extensionContext: vscode.ExtensionContext | undefined = undefined;

export const activate = async (ctx: vscode.ExtensionContext) => {
  extensionContext = ctx;
  const settingsManager = SettingsManager.getInstance(ctx);
  const historyManager = new HistoryManager(ctx);
  const terminalManager = new TerminalManager();
  const openaiCodeFixerService = new OpenaiCodeFixerService(
    ctx,
    settingsManager,
  );

  // Create a model service factory instance
  const modelServiceFactory = new ModelServiceFactory(ctx, settingsManager);
  const models = modelServiceFactory.createModelServices(
    AVAILABLE_MODEL_SERVICES,
  );
  const voiceServiceFactory = new VoiceServiceFactory(ctx, settingsManager);
  const voiceServices = voiceServiceFactory.createVoiceServices(
    AVAILABLE_VOICE_SERVICES,
  );
  const diffViewProvider = new DiffViewProvider(ctx.extensionPath);

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
    openaiCodeFixerService,
    diffViewProvider,
  );

  void registerAndConnectView(ctx, settingsManager, 'chatActivityBar', api);
  void registerAndConnectView(ctx, settingsManager, 'workPanel', api);
  registerCodeActions(api);
  registerInlineCompletion(ctx, settingsManager, connectedViews);
};

export const deactivate = () => {
  extensionContext?.subscriptions?.forEach((sub) => sub.dispose());
};
