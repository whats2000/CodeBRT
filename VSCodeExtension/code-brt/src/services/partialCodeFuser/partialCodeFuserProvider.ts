import * as vscode from 'vscode';

import type { LoadedModelServices } from '../../types';

import type { PartialCodeFuserOptions } from './types';
import { HistoryManager } from '../../api';

export class PartialCodeFuserProvider {
  private readonly historyManager: HistoryManager;
  private readonly loadedModelServices: LoadedModelServices;

  constructor(
    ctx: vscode.ExtensionContext,
    loadedModelServices: LoadedModelServices,
  ) {
    this.historyManager = new HistoryManager(
      ctx,
      'partialCodeFuserIndex.json',
      'partialCodeFuserHistories',
    );
    this.loadedModelServices = loadedModelServices;
  }

  private constructPrompt(
    originalCode: string,
    partialCode: string,
    relativeFilePath: string,
  ): string {
    return `You are an AI code fusion assistant. Complete the partial code based on the original code context.

FILE PATH: ${relativeFilePath}

ORIGINAL CODE:
${originalCode}

PARTIAL CODE TO COMPLETE:
${partialCode}

Rules:
1. Provide a complete implementation that fits seamlessly with the original code.
2. Replace placeholders like "// Other code remain the same" with appropriate code.
3. Maintain the existing coding style and structure.
4. Return only the complete, fused code block.`.trim();
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
    const {
      originalCode,
      partialCode,
      relativeFilePath,
      modelService,
      modelName,
    } = options;

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
          systemPrompt:
            'You are an AI code fusion assistant. Complete partial code precisely in the context of the original code.',
          temperature: 0.7,
        },
      );

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
