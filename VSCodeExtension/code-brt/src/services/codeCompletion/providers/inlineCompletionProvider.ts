import * as vscode from 'vscode';
import AsyncLock from 'async-lock';

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
  private readonly completionLock: AsyncLock;

  constructor(
    ctx: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    loadedModelServices: LoadedModelServices,
    statusBarManager: StatusBarManager,
  ) {
    this.settingsManager = settingsManager;
    this.completionLock = new AsyncLock({ timeout: 10000 });
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

  /**
   * Create a combined cancellation token that cancels if either of the input tokens is cancelled
   */
  private createCombinedCancellationToken(
    ...tokens: vscode.CancellationToken[]
  ): vscode.CancellationToken {
    const combinedToken = new vscode.CancellationTokenSource();

    // Cancel the combined token if any of the input tokens are cancelled
    tokens.forEach((token) => {
      token.onCancellationRequested(() => {
        combinedToken.cancel();
      });
    });

    return combinedToken.token;
  }

  public async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
  ): Promise<
    vscode.InlineCompletionItem[] | vscode.InlineCompletionList | null
  > {
    // Use AsyncLock to ensure thread-safe access
    return this.completionLock.acquire('completion', async () => {
      // Create a new cancellation source to manage request lifecycle
      const completionCancellation = new vscode.CancellationTokenSource();

      // Combine the original token with our new cancellation source
      const combinedToken = this.createCombinedCancellationToken(
        token,
        completionCancellation.token,
      );

      try {
        let modelService: ModelServiceType | null = null;
        let modelName = '';

        // (Existing model selection logic remains the same)
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
          // FIXME: This seems buggy, the model still returns as conversation model so we currently skip qwen2.5-coder
          !lowerCaseModelName.includes('qwen2.5-coder') &&
          (lowerCaseModelName.includes('code') ||
            lowerCaseModelName.includes('starchat') ||
            lowerCaseModelName.includes('stable') ||
            lowerCaseModelName.includes('deepseek'));

        // Use the combined token for completion
        if (isHoleFillerModel) {
          return this.holeFillerModelStrategy.provideCompletion(
            document,
            position,
            combinedToken,
            modelService,
            modelName,
          );
        }
        return this.chatModelStrategy.provideCompletion(
          document,
          position,
          combinedToken,
          modelService,
          modelName,
        );
      } catch (error) {
        // Handle any errors that might occur during completion
        console.error('Completion error:', error);
        return null;
      } finally {
        // Dispose of the cancellation source
        completionCancellation.dispose();
      }
    });
  }
}
