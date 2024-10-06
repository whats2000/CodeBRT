import * as vscode from 'vscode';

import type { LoadedModelServices } from '../../../types';
import { CompletionStrategy } from './index';
import {
  CHAIN_OF_THOUGHT,
  FEW_SHOT_EXAMPLES,
  FILE_TO_LANGUAGE,
  FILE_TO_LANGUAGE_CONTEXT,
  LANGUAGE_NAME_MAPPING,
  MAIN_PROMPT_TEMPLATE,
  SYSTEM_PROMPT,
} from '../constants';
import { CodeLanguageId } from '../types';
import { HistoryManager, SettingsManager } from '../../../api';
import { StatusBarManager } from '../ui/statusBarManager';

export class ManuallyCodeCompletionStrategy implements CompletionStrategy {
  private readonly settingsManager: SettingsManager;
  private readonly historyManager: HistoryManager;
  private readonly loadedModelServices: LoadedModelServices;
  private readonly statusBarManager: StatusBarManager;

  constructor(
    ctx: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    loadedModelServices: LoadedModelServices,
    statusBarManager: StatusBarManager,
  ) {
    this.settingsManager = settingsManager;
    this.historyManager = new HistoryManager(
      ctx,
      'manuallyCodeCompletionIndex.json',
      'manuallyCodeCompletionHistories',
    );
    this.loadedModelServices = loadedModelServices;
    this.statusBarManager = statusBarManager;
  }

  /**
   * Clean the completion response by removing the <COMPLETION> tags and keeping the inner code.
   */
  private cleanCompletionResponse(response: string): string {
    if (
      response.startsWith('Failed to connect to the language model service.')
    ) {
      return '';
    }

    if (!response.includes('<COMPLETION>')) {
      response = `<COMPLETION>${response}</COMPLETION>`;
    }

    response = response.replace(
      /```[a-zA-Z]*\n([\s\S]*?)\n```/g,
      (_, code) => code,
    );

    return response.replace(/<COMPLETION>/g, '').replace(/<\/COMPLETION>/g, '');
  }

  /**
   * Get the response from the model service.
   */
  private async getResponse(prompt: string): Promise<string> {
    const modelService = this.settingsManager.get(
      'lastUsedManualCodeCompletionModelService',
    );
    const modelName = this.settingsManager.get(
      'lastSelectedManualCodeCompletionModel',
    )[modelService];

    // For smaller models, use a simpler prompt
    const systemPrompt =
      modelService === 'ollama'
        ? `${SYSTEM_PROMPT}\n\n${FEW_SHOT_EXAMPLES}`
        : `${SYSTEM_PROMPT}\n\n${CHAIN_OF_THOUGHT}\n\n${FEW_SHOT_EXAMPLES}`;

    // Set the system prompt and temperature
    const history = this.historyManager.getCurrentHistory();
    void this.historyManager.updateHistoryModelAdvanceSettings(history.root, {
      ...history.advanceSettings,
      systemPrompt: systemPrompt,
      temperature: 0.7,
    });

    // Get the response from the model service
    const response = await this.loadedModelServices[
      modelService
    ].service.getResponse({
      query: prompt,
      historyManager: this.historyManager,
      selectedModelName: modelName,
      disableTools: true,
    });

    return this.cleanCompletionResponse(response);
  }

  /**
   * Detect the language from the document based on file extension or language ID.
   */
  private detectLanguage(
    document: vscode.TextDocument,
  ): CodeLanguageId | 'unknown' {
    const fileExtension = document.uri.fsPath.split('.').pop();
    return (
      FILE_TO_LANGUAGE[fileExtension || ''] ||
      FILE_TO_LANGUAGE[document.languageId] ||
      'unknown'
    );
  }

  /**
   * Retrieve the language context or fall back to a default.
   */
  private getLanguageContext(languageId: CodeLanguageId | 'unknown') {
    return (
      FILE_TO_LANGUAGE_CONTEXT[
        languageId as keyof typeof FILE_TO_LANGUAGE_CONTEXT
      ] || {
        topLevelKeywords: ['function', 'if', 'for'],
        singleLineComment: '//',
        endOfLine: [';'],
      }
    );
  }

  /**
   * Get the prefix (code before the cursor).
   */
  private getPrefix(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): string {
    const range = new vscode.Range(new vscode.Position(0, 0), position);
    return document.getText(range);
  }

  /**
   * Get the suffix (code after the cursor).
   */
  private getSuffix(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): string {
    const range = new vscode.Range(
      position,
      new vscode.Position(document.lineCount - 1, Number.MAX_VALUE),
    );
    return document.getText(range);
  }

  /**
   * Build the full prompt by integrating the language-specific information and surrounding code.
   */
  private buildPrompt(
    prefix: string,
    suffix: string,
    languageName: string,
  ): string {
    return MAIN_PROMPT_TEMPLATE.replace('{codeLanguage}', languageName)
      .replace('{prefix}', prefix)
      .replace('{suffix}', suffix);
  }

  /**
   * Invoke the model and handle timeout and cancellation.
   */
  private async getCompletionWithTimeout(
    prompt: string,
    token: vscode.CancellationToken,
  ): Promise<string | null> {
    const timeoutMs = 50000; // 50 seconds request timeout
    return new Promise<string | null>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Request timed out')),
        timeoutMs,
      );

      this.getResponse(prompt)
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });

      token.onCancellationRequested(() => {
        clearTimeout(timeout);
        resolve(null);
      });
    });
  }

  /**
   * Process the completion result and convert it to VSCode InlineCompletionItems.
   */
  private buildInlineCompletionItems(
    completion: string,
    position: vscode.Position,
  ): vscode.InlineCompletionItem[] {
    const inlineCompletionItem = new vscode.InlineCompletionItem(completion);
    inlineCompletionItem.range = new vscode.Range(position, position);
    return [inlineCompletionItem];
  }

  /**
   * Provides inline completion items using manually triggered LLM-based completion.
   * @param document The document in which the completion was triggered.
   * @param position The position at which the completion was triggered.
   * @param token A cancellation token.
   * @returns An array of inline completion items or null.
   */
  public async provideCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<vscode.InlineCompletionItem[] | null> {
    if (!this.settingsManager.get('manualTriggerCodeCompletion')) {
      vscode.window.showWarningMessage(
        'Manual code completion is disabled. Please enable it in the code completion settings.',
      );
      return null;
    }

    // Step 1: Detect the language of the document
    const languageId = this.detectLanguage(document);

    // Step 2: Show the processing status on the status bar
    this.statusBarManager.showProcessing();

    try {
      // Step 3: Retrieve the language context (or fallback to a default context)
      const languageContext = this.getLanguageContext(languageId);

      // TODO: Use this for additional context in the future
      console.debug(languageContext);

      const languageName =
        languageId === 'unknown'
          ? 'Unknown Language'
          : LANGUAGE_NAME_MAPPING[languageId] || 'Unknown Language';

      // Step 4: Extract surrounding code (prefix and suffix)
      const prefix = this.getPrefix(document, position);
      const suffix = this.getSuffix(document, position);

      // Step 5: Build the prompt for the LLM using the context and few-shot examples
      const prompt = this.buildPrompt(prefix, suffix, languageName);

      // Step 6: Call the language model (mock for now)
      const completion = await this.getCompletionWithTimeout(prompt, token);

      if (!completion) {
        return null;
      }

      // Step 7: Process and return the completion as VSCode InlineCompletionItems
      return this.buildInlineCompletionItems(completion, position);
    } finally {
      // Step 8: Show idle status after processing
      this.statusBarManager.showIdle();
    }
  }
}
