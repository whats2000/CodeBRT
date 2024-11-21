import * as vscode from 'vscode';

import { SettingsManager } from '../../../api';
import { LoadedModelServices, ModelServiceType } from '../../../types';
import { StatusBarManager } from '../ui/statusBarManager';
import { ChatModelStrategy, HoleFillerModelStrategy } from '../strategies';

export class InlineCompletionProvider
  implements vscode.InlineCompletionItemProvider
{
  private readonly settingsManager: SettingsManager;
  private readonly chatModelStrategy: ChatModelStrategy;
  private readonly holeFillerModelStrategy: HoleFillerModelStrategy;

  constructor(
    ctx: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    loadedModelServices: LoadedModelServices,
    statusBarManager: StatusBarManager,
  ) {
    this.settingsManager = settingsManager;
    this.chatModelStrategy = new ChatModelStrategy(
      ctx,
      loadedModelServices,
      statusBarManager,
    );
    this.holeFillerModelStrategy = new HoleFillerModelStrategy(
      ctx,
      loadedModelServices,
      statusBarManager,
    );
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
  ): Promise<
    vscode.InlineCompletionItem[] | vscode.InlineCompletionList | null
  > {
    let modelService: ModelServiceType | null = null;
    let modelName = '';
    if (context.triggerKind === vscode.InlineCompletionTriggerKind.Invoke) {
      if (!this.settingsManager.get('manualTriggerCodeCompletion')) {
        return null;
      }

      modelService = this.settingsManager.get(
        'lastUsedManualCodeCompletionModelService',
      );
      modelName = this.settingsManager.get(
        'lastSelectedManualCodeCompletionModel',
      )[modelService];
    } else if (
      context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic
    ) {
      if (!this.settingsManager.get('autoTriggerCodeCompletion')) {
        return null;
      }
      modelService = this.settingsManager.get(
        'lastUsedAutoCodeCompletionModelService',
      );
      modelName = this.settingsManager.get(
        'lastSelectedAutoCodeCompletionModel',
      )[modelService];
    }

    if (!modelService || modelName === '') {
      return null;
    }

    /**
     * Check if the model is a hole filler model.
     * This is a temporary solution until we have a better way to determine the model type.
     */
    const lowerCaseModelName = modelName.toLowerCase();
    const isHoleFillerModel =
      lowerCaseModelName.includes('code') ||
      lowerCaseModelName.includes('starchat') ||
      lowerCaseModelName.includes('stable') ||
      lowerCaseModelName.includes('qwen') ||
      lowerCaseModelName.includes('deepseek');

    if (isHoleFillerModel) {
      return this.holeFillerModelStrategy.provideCompletion(
        document,
        position,
        token,
        modelService,
        modelName,
      );
    }
    return this.chatModelStrategy.provideCompletion(
      document,
      position,
      token,
      modelService,
      modelName,
    );
  }
}
