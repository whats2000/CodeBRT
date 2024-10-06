import * as vscode from 'vscode';

import type { LoadedModelServices } from '../../../types';
import { CompletionStrategy } from './index';
import {
  FEW_SHOT_EXAMPLES,
  FILE_TO_LANGUAGE,
  FILE_TO_LANGUAGE_CONTEXT,
  LANGUAGE_NAME_MAPPING,
  MAIN_PROMPT_TEMPLATE,
  SYSTEM_PROMPT,
} from '../constants';
import { CodeLanguageId } from '../types';
import { HistoryManager, SettingsManager } from '../../../api';

export class AutoCodeCompletionStrategy implements CompletionStrategy {
  private readonly settingsManager: SettingsManager;
  private readonly historyManager: HistoryManager;
  private readonly loadedModelServices: LoadedModelServices;

  // Added state variables and timer
  private shouldProvideCompletion: boolean = false;
  private triggerTimer: NodeJS.Timeout | null = null;

  constructor(
    ctx: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    loadedModelServices: LoadedModelServices,
  ) {
    this.settingsManager = settingsManager;
    this.historyManager = new HistoryManager(
      ctx,
      'autoCodeCompletionIndex.json',
      'autoCodeCompletionHistories',
    );
    this.loadedModelServices = loadedModelServices;

    // Update the history settings for the model, including system prompt and temperature
    const history = this.historyManager.getCurrentHistory();
    void this.historyManager.updateHistoryModelAdvanceSettings(history.root, {
      ...history.advanceSettings,
      systemPrompt: SYSTEM_PROMPT + FEW_SHOT_EXAMPLES,
      temperature: 0.5, // Set a lower temperature for more deterministic predictions
    });

    // Listen for text document changes to detect user input
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.contentChanges.length > 0) {
        this.resetTriggerTimer();
      }
    });

    // Listen for text editor selection changes to detect cursor movement
    vscode.window.onDidChangeTextEditorSelection(() => {
      this.resetTriggerTimer();
    });
  }

  // Method to reset the timer
  private resetTriggerTimer() {
    // If a timer exists, clear it
    if (this.triggerTimer) {
      clearTimeout(this.triggerTimer);
    }
    // Set shouldProvideCompletion to false to temporarily disable completion
    this.shouldProvideCompletion = false;
    // Start a new timer
    this.triggerTimer = setTimeout(() => {
      this.shouldProvideCompletion = true;
      // Notify VSCode to refresh completion suggestions
      this.triggerCompletion();
    }, 3000); // 3 seconds
  }

  // Corrected method to trigger completion refresh in VSCode
  private triggerCompletion() {
    vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
  }

  // Method to get a response from the language model
  private async getResponse(prompt: string): Promise<string> {
    console.log('Sending prompt to model:', prompt);
    const modelService = this.settingsManager.get(
      'lastUsedAutoCodeCompletionModelService',
    );
    const modelName = this.settingsManager.get(
      'lastSelectedAutoCodeCompletionModel',
    )[modelService];
    try {
      const response = await this.loadedModelServices[
        modelService
      ].service.getResponse({
        query: prompt,
        historyManager: this.historyManager,
        selectedModelName: modelName,
      });
      console.log('Received response from model:', response);
      return this.cleanCompletionResponse(response);
    } catch (error) {
      console.error('Error getting response from model:', error);
      if (error instanceof Error) {
        throw new Error(`Error getting response from model: ${error.message}`);
      } else {
        throw new Error('Error getting response from model: Unknown error');
      }
    }
  }

  // Method to clean the completion response
  private cleanCompletionResponse(response: string): string {
    console.log('Cleaning response:', response);
    // Step 1: If <COMPLETION> tags are missing, wrap the entire response with them
    if (!response.includes('<COMPLETION>')) {
      response = `<COMPLETION>${response}</COMPLETION>`;
    }

    // Step 2: Remove only the outer markdown code blocks (```), preserving internal code
    response = response.replace(/```[a-zA-Z]*\n([\s\S]*?)\n```/g, (_, code) => {
      return code;
    });

    // Step 3: Remove the <COMPLETION> tags
    response = response
      .replace(/<COMPLETION>/g, '')
      .replace(/<\/COMPLETION>/g, '');
    console.log('Cleaned response:', response);
    return response;
  }

  // Method to detect the programming language of the document
  private detectLanguage(
    document: vscode.TextDocument,
  ): CodeLanguageId | 'unknown' {
    const fileExtension = document.uri.fsPath.split('.').pop();
    const language =
      FILE_TO_LANGUAGE[fileExtension || ''] ||
      FILE_TO_LANGUAGE[document.languageId] ||
      'unknown';
    console.log('Detected language:', language);
    return language;
  }

  // Method to retrieve the language context
  private getLanguageContext(languageId: CodeLanguageId | 'unknown') {
    const context = FILE_TO_LANGUAGE_CONTEXT[
      languageId as keyof typeof FILE_TO_LANGUAGE_CONTEXT
    ] || {
      topLevelKeywords: ['function', 'if', 'for'],
      singleLineComment: '//',
      endOfLine: [';'],
    };
    console.log('Retrieved language context:', context);
    return context;
  }

  // Method to get the prefix (code before the cursor)
  private getPrefix(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): string {
    const range = new vscode.Range(new vscode.Position(0, 0), position);
    const prefix = document.getText(range);
    console.log('Extracted prefix:', prefix);
    return prefix;
  }

  // Method to get the suffix (code after the cursor)
  private getSuffix(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): string {
    const range = new vscode.Range(
      position,
      document.lineAt(document.lineCount - 1).range.end,
    );
    const suffix = document.getText(range);
    console.log('Extracted suffix:', suffix);
    return suffix;
  }

  // Method to build the prompt for the language model
  private buildPrompt(
    prefix: string,
    suffix: string,
    languageName: string,
  ): string {
    const prompt = MAIN_PROMPT_TEMPLATE.replace('{codeLanguage}', languageName)
      .replace('{prefix}', prefix)
      .replace('{suffix}', suffix);
    console.log('Built prompt:', prompt);
    return prompt;
  }

  // Method to get the completion response from the language model with a timeout
  private async getCompletionWithTimeout(
    prompt: string,
    token: vscode.CancellationToken,
  ): Promise<string | null> {
    const timeoutMs = 30000;
    console.log('Starting model request with timeout:', timeoutMs);
    return new Promise<string | null>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('Request timed out');
        reject(new Error('Request timed out'));
      }, timeoutMs);

      this.getResponse(prompt)
        .then((result) => {
          clearTimeout(timeout);
          console.log('Model request completed successfully');
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          console.error('Error during model request:', error);
          reject(error);
        });

      token.onCancellationRequested(() => {
        console.log('Request was cancelled');
        clearTimeout(timeout);
        resolve(null);
      });
    });
  }

  // Method to build inline completion items
  private buildInlineCompletionItems(
    completion: string,
    position: vscode.Position,
  ): vscode.InlineCompletionItem[] {
    console.log(
      'Building inline completion items from completion:',
      completion,
    );
    const inlineCompletionItem = new vscode.InlineCompletionItem(completion);
    console.log('Returning completion item range:', inlineCompletionItem.range);

    inlineCompletionItem.range = new vscode.Range(position, position);
    return [inlineCompletionItem];
  }

  // Method to provide completion items
  public async provideCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<vscode.InlineCompletionItem[] | null> {
    console.log('Providing completion for document at position:', position);
    if (this.shouldProvideCompletion) {
      const completionItems = await this.provideCompletionLogic(
        document,
        position,
        token,
      );
      return completionItems;
    } else {
      return null;
    }
  }

  // The actual completion logic
  private async provideCompletionLogic(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<vscode.InlineCompletionItem[] | null> {
    console.log('Executing provideCompletionLogic');

    if (!this.settingsManager.get('autoTriggerCodeCompletion')) {
      vscode.window.showWarningMessage(
        'Auto code completion is disabled. Please enable it in the code completion settings.',
      );
      return null;
    }

    // Step 1: Detect the language of the document
    const languageId = this.detectLanguage(document);
    console.log('Detected language ID:', languageId);

    // Step 2: Retrieve the language context
    const languageContext = this.getLanguageContext(languageId);
    console.log('Language context:', languageContext);

    // Retrieve language name
    const languageName =
      languageId === 'unknown'
        ? 'Unknown Language'
        : LANGUAGE_NAME_MAPPING[languageId] || 'Unknown Language';
    console.log('Language name:', languageName);

    // Step 3: Extract surrounding code (prefix and suffix)
    const prefix = this.getPrefix(document, position);
    console.log('Extracted prefix:', prefix);

    const suffix = this.getSuffix(document, position);
    console.log('Extracted suffix:', suffix);

    // Step 4: Build the prompt
    const prompt = this.buildPrompt(prefix, suffix, languageName);
    console.log('Built prompt:', prompt);

    // Step 5: Call the language model to get completion with a timeout
    const completion = await this.getCompletionWithTimeout(prompt, token);
    if (!completion) {
      console.log('No completion received');
      return null;
    }

    console.log('Received completion:', completion);

    // Step 6: Build inline completion items
    const inlineCompletionItems = this.buildInlineCompletionItems(
      completion,
      position,
    );
    console.log('Built inline completion items:', inlineCompletionItems);
    console.log('Returning completion items:', inlineCompletionItems);

    // Reset shouldProvideCompletion to prevent repeated triggering
    this.shouldProvideCompletion = false;

    return inlineCompletionItems;
  }
}
