import * as vscode from 'vscode';

import type { LoadedModelServices } from '../../types';

import type { PartialCodeFuserOptions } from './types';
import { HistoryManager, SettingsManager } from '../../api';
import { SYSTEM_PROMPT } from './constants';

export class PartialCodeFuser {
  private readonly settingsManager: SettingsManager;
  private readonly historyManager: HistoryManager;
  private readonly loadedModelServices: LoadedModelServices;

  constructor(
    ctx: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    loadedModelServices: LoadedModelServices,
  ) {
    this.historyManager = new HistoryManager(
      ctx,
      'partialCodeFuserIndex.json',
      'partialCodeFuserHistories',
    );
    this.settingsManager = settingsManager;
    this.loadedModelServices = loadedModelServices;
  }

  private constructPrompt(
    originalCode: string,
    partialCode: string,
    relativeFilePath: string,
  ): string {
    const fileExtension = relativeFilePath.split('.').pop();
    return `**Original Code**:  
\`\`\`${fileExtension}
${originalCode}
\`\`\`

**Modified Code**:  
\`\`\`${fileExtension}
${partialCode}
\`\`\``;
  }

  /**
   * Fuse the partial code with the original code to generate a complete code block.
   * @param options Options for the partial code fusion.
   * @returns The fused code block or null if the fusion failed.
   * @See PartialCodeFuserOptions
   */
  public async fusePartialCode(
    options: PartialCodeFuserOptions,
  ): Promise<string | null> {
    const { originalCode, partialCode, relativeFilePath } = options;

    const prompt = this.constructPrompt(
      originalCode,
      partialCode,
      relativeFilePath,
    );

    try {
      // Prepare history settings
      const history = this.historyManager.getCurrentHistory();
      await this.historyManager.updateHistoryModelAdvanceSettings(
        history.root,
        {
          ...history.advanceSettings,
          systemPrompt: SYSTEM_PROMPT,
          temperature: 0.7,
        },
      );

      const modelService = this.settingsManager.get('lastUsedModelService');
      const modelName =
        this.settingsManager.get('lastSelectedModel')[modelService];

      // Get response from model service
      const response = await this.loadedModelServices[
        modelService
      ].service.getResponse({
        query: prompt,
        historyManager: this.historyManager,
        selectedModelName: modelName,
        disableTools: true,
      });

      // Clean and return the fused code
      return response.textResponse;
    } catch (error) {
      vscode.window.showErrorMessage(`Partial code fusion failed: ${error}`);
      return null;
    }
  }
}
