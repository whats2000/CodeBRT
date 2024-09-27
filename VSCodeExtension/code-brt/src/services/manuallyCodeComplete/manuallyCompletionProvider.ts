import * as vscode from 'vscode';

import type {
  ExtendedGetResponseOptions,
  LoadedModelServices,
  ManuallyCompleteLanguageInfo,
  ModelServiceType,
} from '../../types';
import {
  BUILD_IN_FUNCTIONS_PROMPT_TEMPLATE,
  COMMON_LIBRARIES_PROMPT_TEMPLATE,
  Constants,
  MAIN_PROMPT_TEMPLATE,
  TRIGGER_KIND_PROMPT_TEMPLATE,
} from './constants';
import { SettingsManager } from '../../api';
import { filterCodeSnippets } from './filters';

let extensionContext: vscode.ExtensionContext;

export class ManuallyCompletionProvider
  implements vscode.CompletionItemProvider
{
  constructor(
    private settingsManager: SettingsManager,
    private models: LoadedModelServices,
  ) {}

  private getLanguageInfo(languageId: string): ManuallyCompleteLanguageInfo {
    const mappedId = this.mapLanguageId(languageId);
    return Constants[mappedId];
  }

  private mapLanguageId(vsCodeLangId: string): string {
    const mapping: { [key: string]: string } = {
      typescript: 'ts',
      javascript: 'js',
      typescriptreact: 'tsx',
      javascriptreact: 'jsx',
      python: 'py',
      jupyter: 'ipynb',
      java: 'java',
      cpp: 'cpp',
      csharp: 'cs',
      c: 'c',
      php: 'php',
      ruby: 'rb',
      clojure: 'clj',
      r: 'r',
      yaml: 'yaml',
      markdown: 'md',
    };
    return mapping[vsCodeLangId] || vsCodeLangId;
  }

  private getLanguageName(languageId: string): string {
    const mapping: { [key: string]: string } = {
      typescript: 'TypeScript',
      javascript: 'JavaScript',
      jsx: 'JavaScript',
      python: 'Python',
      jupyter: 'Jupyter Notebook',
      java: 'Java',
      cpp: 'C++',
      csharp: 'C#',
      c: 'C',
      php: 'PHP',
      ruby: 'Ruby',
      clojure: 'Clojure',
      r: 'R',
      yaml: 'YAML',
      markdown: 'Markdown',
    };
    return mapping[languageId] || 'Unknown';
  }

  private buildPromptWithLanguageInfo(
    prefix: string,
    suffix: string,
    languageId: string,
    context: vscode.CompletionContext,
  ): string {
    const languageInfo = this.getLanguageInfo(languageId);

    let prompt = MAIN_PROMPT_TEMPLATE.replace(
      '{languageName}',
      this.getLanguageName(languageId),
    )
      .replace('{prefix}', prefix)
      .replace('{suffix}', suffix);

    if (languageInfo.builtInFunctions) {
      prompt += BUILD_IN_FUNCTIONS_PROMPT_TEMPLATE.replace(
        '{builtInFunctions}',
        languageInfo.builtInFunctions.join(', '),
      );
    }

    if (languageInfo.commonLibraries) {
      prompt += COMMON_LIBRARIES_PROMPT_TEMPLATE.replace(
        '{commonLibraries}',
        languageInfo.commonLibraries.join(', '),
      );
    }

    if (context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter) {
      prompt += TRIGGER_KIND_PROMPT_TEMPLATE.replace(
        '{triggerCharacter}',
        context.triggerCharacter || '',
      );
    }

    prompt = prompt.replace(/```/g, '');

    return prompt;
  }

  private cleanCompletionResult(completion: string): string {
    return completion.replace(/```/g, '').trim();
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext,
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList> {
    try {
      if (token.isCancellationRequested) {
        console.log('Operation cancelled at start');
        return new vscode.CompletionList([], false);
      }

      console.log('Completion context:', {
        triggerKind: context.triggerKind,
        triggerCharacter: context.triggerCharacter,
      });

      const prefixLines = document
        .getText(
          new vscode.Range(
            new vscode.Position(Math.max(0, position.line - 5), 0),
            position,
          ),
        )
        .split('\n');
      const suffixLines = document
        .getText(
          new vscode.Range(
            position,
            new vscode.Position(
              Math.min(document.lineCount - 1, position.line + 5),
              Number.MAX_VALUE,
            ),
          ),
        )
        .split('\n');

      const prefix = prefixLines.join('\n');
      const suffix = suffixLines.join('\n');

      const languageId = document.languageId;
      console.log('Language ID:', languageId);

      const languageInfo = this.getLanguageInfo(languageId);
      console.log('Language Info from Constants:', languageInfo);

      console.log('Providing completion items for:', languageId);
      console.log('Prefix:', prefix);
      console.log('Suffix:', suffix);

      const modelType = this.settingsManager.get(
        'lastUsedModelForManualCompletion',
      ) as ModelServiceType;
      console.log('Using model for manual completion:', modelType);

      const prompt = this.buildPromptWithLanguageInfo(
        prefix,
        suffix,
        languageId,
        context,
      );

      const completionResult = await this.getModelCompletionWithTimeout(
        modelType,
        prompt,
        languageInfo,
        token,
        prefix,
        suffix,
      );

      if (completionResult.cancelled) {
        console.log(
          'Operation cancelled or timed out:',
          completionResult.timings,
        );
        return new vscode.CompletionList([], false);
      }

      console.log('Completion timings:', completionResult.timings);
      console.log('Received completion:', completionResult.completion);

      const completionItems = this.processCompletion(
        completionResult.completion,
        prefix,
        languageId,
        context,
      );
      console.log('Processed completion items:', completionItems);

      return new vscode.CompletionList(completionItems, true);
    } catch (error) {
      console.error('Error in provideCompletionItems:', error);
      return new vscode.CompletionList([], false);
    }
  }

  private async getModelCompletionWithTimeout(
    modelType: ModelServiceType,
    prompt: string,
    languageInfo: ManuallyCompleteLanguageInfo,
    token: vscode.CancellationToken,
    prefix: string,
    suffix: string,
  ): Promise<{
    completion: string;
    cancelled: boolean;
    timings: {
      totalTime: number;
      requestStartTime: number;
      responseReceivedTime: number;
      processingStartTime: number;
      processingEndTime: number;
    };
  }> {
    return new Promise((resolve) => {
      const totalTimeoutMs = 60000; // 60 seconds total timeout
      const requestTimeoutMs = 50000; // 50 seconds request timeout
      let timeoutId: NodeJS.Timeout;

      const startTime = Date.now();
      let requestStartTime: number;
      let responseReceivedTime: number;
      let processingStartTime: number;
      let processingEndTime: number;

      const completionPromise = new Promise<string>((resolveCompletion) => {
        requestStartTime = Date.now();
        const options: ExtendedGetResponseOptions = { query: prompt };
        if (languageInfo.useMultiline) {
          options.multiline = languageInfo.useMultiline({ prefix, suffix });
        }
        this.models[modelType].service.getResponse(options).then((response) => {
          responseReceivedTime = Date.now();
          resolveCompletion(response);
        });
      });

      const requestTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.log('Model request timed out');
          reject(new Error('Request timed out'));
        }, requestTimeoutMs);
      });

      const totalTimeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          console.log('Total operation timed out');
          reject(new Error('Total operation timed out'));
        }, totalTimeoutMs);
      });

      const cancelPromise = new Promise<never>((_, reject) => {
        token.onCancellationRequested(() => {
          console.log('Model request explicitly cancelled');
          reject(new Error('Request cancelled'));
        });
      });

      Promise.race([
        completionPromise,
        requestTimeoutPromise,
        totalTimeoutPromise,
        cancelPromise,
      ])
        .then((completion) => {
          clearTimeout(timeoutId);
          processingStartTime = Date.now();
          const cleanCompletion = this.cleanCompletionResult(
            completion as string,
          );
          processingEndTime = Date.now();
          resolve({
            completion: cleanCompletion,
            cancelled: false,
            timings: {
              totalTime: processingEndTime - startTime,
              requestStartTime: requestStartTime - startTime,
              responseReceivedTime: responseReceivedTime - startTime,
              processingStartTime: processingStartTime - startTime,
              processingEndTime: processingEndTime - startTime,
            },
          });
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          console.error(
            'Error or cancellation in getModelCompletionWithTimeout:',
            error,
          );
          resolve({
            completion: '',
            cancelled: true,
            timings: {
              totalTime: Date.now() - startTime,
              requestStartTime: requestStartTime
                ? requestStartTime - startTime
                : -1,
              responseReceivedTime: responseReceivedTime
                ? responseReceivedTime - startTime
                : -1,
              processingStartTime: -1,
              processingEndTime: -1,
            },
          });
        });
    });
  }

  private processCompletion(
    completion: string,
    prefix: string,
    languageId: string,
    context: vscode.CompletionContext,
  ): vscode.CompletionItem[] {
    const cleanedCompletion = this.removeLanguageIdentifier(completion);
    console.log('Original completion:', completion);
    console.log('Cleaned completion:', cleanedCompletion);

    const snippets = filterCodeSnippets(cleanedCompletion, languageId);

    return snippets
      .map((snippet, index) => {
        const { uniqueContent, shouldStartNewLine } =
          this.removeOverlapAndCheckNewLine(prefix, snippet);
        if (!uniqueContent) return null;

        const completionItem = new vscode.CompletionItem(
          uniqueContent,
          vscode.CompletionItemKind.Snippet,
        );

        // If the completion should start on a new line, add a newline character at the beginning
        completionItem.insertText = shouldStartNewLine
          ? '\n' + uniqueContent
          : uniqueContent;

        completionItem.detail = `Suggested by ${this.settingsManager.get('lastUsedModelForManualCompletion')}`;

        const languageInfo = this.getLanguageInfo(languageId);
        if (
          languageInfo.endOfLine.length > 0 &&
          !snippet.endsWith(languageInfo.endOfLine[0])
        ) {
          completionItem.insertText += languageInfo.endOfLine[0];
        }

        if (
          context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter
        ) {
          completionItem.sortText = `0${index}`;
        } else {
          completionItem.sortText = `1${index}`;
        }
        return completionItem;
      })
      .filter((item): item is vscode.CompletionItem => item !== null);
  }

  private removeLanguageIdentifier(completion: string): string {
    let cleaned = completion.replace(
      /^(typescript|javascript|python|java|cpp|csharp|go|rust|swift)\s*\n/i,
      '',
    );

    cleaned = cleaned.replace(
      /^(typescript|javascript|python|java|cpp|csharp|go|rust|swift)\\n/i,
      '',
    );

    cleaned = cleaned.replace(/^```[a-z]*\s*\n/i, '').replace(/\n```$/i, '');

    cleaned = cleaned.replace(/^\\n|\\n/gm, '\n');

    cleaned = cleaned.replace(
      /^(typescript|javascript|python|java|cpp|csharp|go|rust|swift):/i,
      '',
    );

    return cleaned.trim();
  }

  private removeOverlapAndCheckNewLine(
    prefix: string,
    suggestion: string,
  ): { uniqueContent: string | null; shouldStartNewLine: boolean } {
    const prefixLines = prefix.trim().split('\n');
    const suggestionLines = suggestion.trim().split('\n');

    let diffIndex = 0;
    while (
      diffIndex < prefixLines.length &&
      diffIndex < suggestionLines.length
    ) {
      if (prefixLines[diffIndex].trim() !== suggestionLines[diffIndex].trim()) {
        break;
      }
      diffIndex++;
    }

    if (diffIndex === suggestionLines.length) {
      return { uniqueContent: null, shouldStartNewLine: false };
    }

    const uniqueContent = suggestionLines.slice(diffIndex).join('\n');

    // Check if the unique content should start on a new line
    const shouldStartNewLine = this.shouldStartNewLine(
      prefixLines[prefixLines.length - 1],
      suggestionLines[diffIndex],
    );

    return { uniqueContent, shouldStartNewLine };
  }

  private shouldStartNewLine(
    lastPrefixLine: string,
    firstSuggestionLine: string,
  ): boolean {
    // Check if the last prefix line is a complete statement or block
    const isCompleteStatement = /[;{}]\s*$/.test(lastPrefixLine.trim());

    // Check if the first suggestion line starts a new block or statement
    const startsNewBlock =
      /^[{\s]*$/.test(firstSuggestionLine.trim()) ||
      /^\s*(if|for|while|switch|function|class)/.test(
        firstSuggestionLine.trim(),
      );

    // Check indentation difference
    const prefixMatch = lastPrefixLine.match(/^\s*/);
    const prefixIndent = prefixMatch ? prefixMatch[0].length : 0;
    const suggestionMatch = firstSuggestionLine.match(/^\s*/);
    const suggestionIndent = suggestionMatch ? suggestionMatch[0].length : 0;
    const indentationChanged = Math.abs(suggestionIndent - prefixIndent) >= 2; // 假设 tab 大小为 2

    return isCompleteStatement || startsNewBlock || indentationChanged;
  }

  public switchModelType(modelType: ModelServiceType): void {
    if (this.models[modelType]) {
      void this.settingsManager.set(
        'lastUsedModelForManualCompletion',
        modelType,
      );
    } else {
      throw new Error(`Model type ${modelType} is not available`);
    }
  }

  public getAvailableModelTypes(): ModelServiceType[] {
    return Object.keys(this.models) as ModelServiceType[];
  }

  async getCustomPromptCompletion(
    modelType: ModelServiceType,
    prompt: string,
    languageId: string,
    token: vscode.CancellationToken,
  ): Promise<string | null> {
    try {
      console.log('Custom prompt completion requested for:', modelType);
      console.log('Prompt:', prompt);
      console.log('Language ID:', languageId);

      const languageInfo = this.getLanguageInfo(languageId);
      const options: ExtendedGetResponseOptions = { query: prompt };

      if (languageInfo.useMultiline) {
        options.multiline = languageInfo.useMultiline({
          prefix: '',
          suffix: '',
        });
      }

      if (token.isCancellationRequested) {
        console.log('Operation cancelled before sending request.');
        return null;
      }

      const responsePromise =
        this.models[modelType].service.getResponse(options);

      const response = await Promise.race([
        responsePromise,
        new Promise<string>((_, reject) => {
          token.onCancellationRequested(() => {
            reject(new Error('Operation cancelled'));
          });
        }),
      ]);

      console.log('Raw response:', response);

      if (token.isCancellationRequested) {
        console.log('Operation cancelled after receiving response.');
        return null;
      }

      const cleanedResponse = this.cleanCompletionResult(response);
      console.log('Cleaned response:', cleanedResponse);

      const snippets = filterCodeSnippets(cleanedResponse, languageId);
      console.log('Filtered snippets:', snippets);

      return snippets.length > 0 ? snippets[0] : null;
    } catch (error) {
      if (error instanceof Error && error.message === 'Operation cancelled') {
        console.log('Operation was cancelled during getResponse.');
        return null;
      }
      console.error('Error in getCustomPromptCompletion:', error);
      throw error;
    }
  }
}

export function activateManuallyComplete(
  ctx: vscode.ExtensionContext,
  settingsManager: SettingsManager,
  models: LoadedModelServices,
) {
  extensionContext = ctx;

  const completionProvider = new ManuallyCompletionProvider(
    settingsManager,
    models,
  );

  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.switchAutocompleteModel',
      async () => {
        const modelTypes = completionProvider.getAvailableModelTypes();
        const selectedType = await vscode.window.showQuickPick(modelTypes, {
          placeHolder: 'Select a model type for manuallyCodeComplete',
        });
        if (selectedType) {
          completionProvider.switchModelType(selectedType as ModelServiceType);
          vscode.window.showInformationMessage(
            `Switched autocomplete model to ${selectedType}`,
          );
        }
      },
    ),
  );
  return completionProvider;
}

export function deactivateManuallyComplete() {
  while (extensionContext.subscriptions.length) {
    const subscription = extensionContext.subscriptions.pop()!;
    subscription.dispose();
  }
}
