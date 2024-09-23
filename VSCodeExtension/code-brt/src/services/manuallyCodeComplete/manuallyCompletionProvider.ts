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

    prompt = prompt.replace(/```/g, '');

    return prompt;
  }

  private cleanCompletionResult(completion: string): string {
    return completion.replace(/```/g, '').trim();
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    // TODO: Add support for completion context
    _token: vscode.CancellationToken,
    _ctx: vscode.CompletionContext,
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList> {
    try {
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
      const languageInfo = this.getLanguageInfo(languageId);

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
      );

      let completion: string;
      if (languageInfo.useMultiline) {
        const useMultiline = languageInfo.useMultiline({
          prefix,
          suffix,
        });
        completion = await this.models[modelType].service.getResponse({
          query: prompt,
          multiline: useMultiline,
        } as ExtendedGetResponseOptions);
      } else {
        completion = await this.models[modelType].service.getResponse({
          query: prompt,
        });
      }
      const cleanCompletion = this.cleanCompletionResult(completion);

      console.log('Received completion:', cleanCompletion);

      const completionItems = this.processCompletion(
        cleanCompletion,
        languageId,
      );
      console.log('Processed completion items:', completionItems);

      return new vscode.CompletionList(completionItems, true);
    } catch (error) {
      console.error('Error in provideCompletionItems:', error);
      return new vscode.CompletionList([], false);
    }
  }

  private processCompletion(
    completion: string,
    languageId: string,
  ): vscode.CompletionItem[] {
    console.log('Original completion:', completion);

    const languageInfo = this.getLanguageInfo(languageId);
    const filteredSnippets = filterCodeSnippets(completion, languageId);
    console.log('Filtered snippets:', filteredSnippets);

    return filteredSnippets.map((snippet) => {
      const completionItem = new vscode.CompletionItem(
        snippet,
        vscode.CompletionItemKind.Snippet,
      );
      completionItem.insertText = snippet;
      completionItem.detail = `Suggested by ${this.settingsManager.get('lastUsedModelService')}`;

      if (
        languageInfo.endOfLine.length > 0 &&
        !snippet.endsWith(languageInfo.endOfLine[0])
      ) {
        completionItem.insertText += languageInfo.endOfLine[0];
      }

      return completionItem;
    });
  }

  public switchModelType(modelType: ModelServiceType): void {
    if (this.models[modelType]) {
      this.settingsManager.set('lastUsedModelForManualCompletion', modelType);
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
      // '.',
      // ' ',
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
