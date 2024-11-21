import * as vscode from 'vscode';

import type { DiffControllerOptions } from './types';
import { DiffIntegration } from './diffIntegration';

export class DiffIntegrationProvider {
  /**
   * Create a diff integration instance
   * @param options Optional configuration for the diff integration
   */
  public static createDiffIntegration(
    options: DiffControllerOptions = {},
  ): DiffIntegration {
    return new DiffIntegration(options);
  }

  /**
   * Register diff-related commands and integrations
   * @param context VSCode extension context
   */
  public static activate(context: vscode.ExtensionContext): DiffIntegration {
    const diffIntegration = this.createDiffIntegration();

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'extension.showFileDiff',
        (originalUri, modifiedUri) => {
          diffIntegration.openDiffView(originalUri, modifiedUri);
        },
      ),
    );

    return diffIntegration;
  }
}
