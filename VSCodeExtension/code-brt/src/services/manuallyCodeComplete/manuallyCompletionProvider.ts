import * as vscode from 'vscode';

import type {
  LoadedModelServices,
  ModelServiceType,
  ExtendedGetResponseOptions,
  ManuallyCompleteLanguageInfo,
} from '../../types';
import { Constants, supportedLanguages } from './constants';
import { SettingsManager } from '../../api';
import { filterCodeSnippets } from './filters';

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
    const languageName = this.getLanguageName(languageId);

    let prompt = `Complete the following ${languageName} code. The completion should fit between the prefix and suffix. Provide only the code that should be inserted, no explanations:\n\nPrefix:\n${prefix}\n\nSuffix:\n${suffix}\n\nCompletion:`;

    if (languageInfo.builtInFunctions) {
      prompt += `\n\nAvailable built-in functions: ${languageInfo.builtInFunctions.join(', ')}`;
    }

    if (languageInfo.commonLibraries) {
      prompt += `\n\nCommon libraries: ${languageInfo.commonLibraries.join(', ')}`;
    }

    if (context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter) {
      prompt += `\n\nThis completion was triggered by the character: ${context.triggerCharacter}`;
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
    //TODO
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
      const totalTimeoutMs = 60000; // 30 seconds total timeout
      const requestTimeoutMs = 50000; // 20 seconds request timeout
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
          const useMultiline = languageInfo.useMultiline({ prefix, suffix });
          options.multiline = useMultiline;
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
        const uniqueContent = this.removeOverlap(prefix, snippet);
        if (!uniqueContent) return null; // 如果沒有新內容，返回 null

        const completionItem = new vscode.CompletionItem(
          uniqueContent,
          vscode.CompletionItemKind.Snippet,
        );
        completionItem.insertText = uniqueContent;
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
          completionItem.sortText = `0${index}`; // 使觸發字符觸發的補全項排在前面
        } else {
          completionItem.sortText = `1${index}`;
        }
        return completionItem;
      })
      .filter((item): item is vscode.CompletionItem => item !== null);
  }

  private removeLanguageIdentifier(completion: string): string {
    // 移除開頭的獨立語言標識符
    let cleaned = completion.replace(
      /^(typescript|javascript|python|java|cpp|csharp|go|rust|swift)\s*\n/i,
      '',
    );

    // 移除嵌入在代碼開始處的語言標識符
    cleaned = cleaned.replace(
      /^(typescript|javascript|python|java|cpp|csharp|go|rust|swift)\\n/i,
      '',
    );

    // 移除可能包裹在代碼塊中的語言標識符
    cleaned = cleaned.replace(/^```[a-z]*\s*\n/i, '').replace(/\n```$/i, '');

    // 移除每行開頭的反斜杠和 n
    cleaned = cleaned.replace(/^\\n|\\n/gm, '\n');

    // 移除行首的語言標識符（如果存在）
    cleaned = cleaned.replace(
      /^(typescript|javascript|python|java|cpp|csharp|go|rust|swift):/i,
      '',
    );

    return cleaned.trim();
  }

  private removeOverlap(prefix: string, suggestion: string): string | null {
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
      return null; // 如果建議完全包含在前綴中，返回 null
    }

    return suggestionLines.slice(diffIndex).join('\n');
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
}

let extensionContext: vscode.ExtensionContext;

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
    vscode.languages.registerCompletionItemProvider(
      supportedLanguages,
      completionProvider,
      '.',
    ),
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
