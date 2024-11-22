import * as vscode from 'vscode';

import type {
  CodeLanguageId,
  CompletionStrategy,
  CompletionTemplate,
  LoadedModelServices,
  ModelServiceType,
} from '../../../types';
import { FILE_TO_LANGUAGE, LANGUAGE_NAME_MAPPING } from '../constants';
import { HistoryManager } from '../../../api';
import { StatusBarManager } from '../ui/statusBarManager';
import { getTemplateForModel, postProcessCompletion } from '../utils';

export class HoleFillerModelStrategy implements CompletionStrategy {
  private readonly historyManager: HistoryManager;
  private readonly loadedModelServices: LoadedModelServices;
  private readonly statusBarManager: StatusBarManager;

  constructor(
    ctx: vscode.ExtensionContext,
    loadedModelServices: LoadedModelServices,
    statusBarManager: StatusBarManager,
  ) {
    this.historyManager = new HistoryManager(
      ctx,
      'holeFillerIndex.json',
      'holeFillerHistories',
    );
    this.loadedModelServices = loadedModelServices;
    this.statusBarManager = statusBarManager;
  }

  private detectLanguageId(
    document: vscode.TextDocument,
  ): CodeLanguageId | 'unknown' {
    const fileExtension =
      document.uri.fsPath.split('.').pop()?.toLowerCase() || '';
    const languageIdFromExtension = FILE_TO_LANGUAGE[fileExtension];
    const languageId =
      languageIdFromExtension || document.languageId.toLowerCase();

    if (LANGUAGE_NAME_MAPPING[languageId as CodeLanguageId]) {
      return languageId as CodeLanguageId;
    } else {
      return 'unknown';
    }
  }

  private cleanCompletionResponse(response: string): string {
    return response.trim();
  }

  private async getResponse(
    prompt: string,
    modelService: ModelServiceType,
    modelName: string,
    template: CompletionTemplate,
  ): Promise<string> {
    const history = this.historyManager.getCurrentHistory();
    await this.historyManager.updateHistoryModelAdvanceSettings(history.root, {
      ...history.advanceSettings,
      systemPrompt: '',
      temperature: template.completionOptions?.temperature || 0.7,
      maxTokens: template.completionOptions?.maxTokens || 150,
      stop: template.completionOptions?.stop || undefined,
    });

    const response = await this.loadedModelServices[
      modelService
    ].service.getResponse({
      query: prompt,
      historyManager: this.historyManager,
      selectedModelName: modelName,
      disableTools: true,
    });

    return this.cleanCompletionResponse(response.textResponse);
  }

  public async provideCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    modelService: ModelServiceType,
    modelName: string,
  ): Promise<vscode.InlineCompletionItem[] | null> {
    this.statusBarManager.showProcessing();

    try {
      if (!this.loadedModelServices[modelService]) {
        console.warn(`Model service ${modelService} is not loaded.`);
        return null;
      }

      const languageId = this.detectLanguageId(document);
      if (languageId === 'unknown') {
        console.warn('Unsupported language for code completion.');
        return null;
      }

      const language = LANGUAGE_NAME_MAPPING[languageId];

      const template = getTemplateForModel(modelName);

      if (!template) {
        console.warn(`No template found for model ${modelName}`);
        return null;
      }

      const maxLines = 20;
      const startLine = Math.max(0, position.line - maxLines);
      const endLine = Math.min(
        document.lineCount - 1,
        position.line + maxLines,
      );

      const prefix = document.getText(
        new vscode.Range(new vscode.Position(startLine, 0), position),
      );

      const suffix = document.getText(
        new vscode.Range(
          position,
          new vscode.Position(endLine, Number.MAX_VALUE),
        ),
      );

      const filepath = document.uri.fsPath;

      const prompt =
        typeof template.template === 'function'
          ? template.template(prefix, suffix, filepath, language)
          : template.template
              .replace('{{{prefix}}}', prefix)
              .replace('{{{suffix}}}', suffix);

      if (token.isCancellationRequested) {
        return null;
      }

      const rawResponse = await this.getResponse(
        prompt,
        modelService,
        modelName,
        template,
      );

      const postProcessedResult = postProcessCompletion(
        rawResponse,
        prefix,
        suffix,
        modelName,
      );

      if (!postProcessedResult) {
        return null;
      }

      const completionItem = new vscode.InlineCompletionItem(
        postProcessedResult,
        new vscode.Range(position, position),
      );

      return [completionItem];
    } catch (error) {
      console.error('Autocomplete error:', error);
      return null;
    } finally {
      this.statusBarManager.showIdle();
    }
  }
}
