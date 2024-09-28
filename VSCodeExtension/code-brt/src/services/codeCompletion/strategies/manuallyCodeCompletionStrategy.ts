import * as vscode from 'vscode';
import { CompletionStrategy } from './index';
import {
  FILE_TO_LANGUAGE,
  FILE_TO_LANGUAGE_CONTEXT,
  LANGUAGE_NAME_MAPPING,
  MAIN_PROMPT_TEMPLATE,
  SYSTEM_PROMPT,
} from '../constants';
import { CodeLanguageId } from '../types';

const mockLLMInvoke = async (prompt: string) => {
  return `This is a mock completion for the prompt: ${prompt}`;
};

export class ManuallyCodeCompletionStrategy implements CompletionStrategy {
  constructor() {}

  /**
   * Provides inline completion items using manually triggered LLM-based completion.
   */
  async provideCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
  ): Promise<vscode.InlineCompletionItem[] | null> {
    // Step 1: Detect the language of the document
    const languageId = this.detectLanguage(document);

    // Step 2: Retrieve the language context (or fallback to a default context)
    const languageContext = this.getLanguageContext(languageId);

    // TODO: The context is not in-use yet, but will finish the implementation in the future
    console.log('Language context:', languageContext);

    const languageName =
      languageId === 'unknown'
        ? 'Unknown Language'
        : LANGUAGE_NAME_MAPPING[languageId] || 'Unknown Language';

    // Step 3: Extract surrounding code (prefix and suffix)
    const prefix = this.getPrefix(document, position);
    const suffix = this.getSuffix(document, position);

    // Step 4: Build the prompt for the LLM using the context
    const prompt = this.buildPrompt(prefix, suffix, languageName, context);

    // Step 5: Call the language model (mock for now)
    const completion = await this.getCompletionWithTimeout(prompt, token);

    if (!completion) {
      return null;
    }

    // Step 6: Process and return the completion as VSCode InlineCompletionItems
    return this.buildInlineCompletionItems(completion, position);
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
   * Retrieve the language context (keywords, comment styles, etc.) or fall back to a default.
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
    const range = new vscode.Range(
      new vscode.Position(Math.max(0, position.line - 10), 0),
      position,
    );
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
      new vscode.Position(
        Math.min(document.lineCount - 1, position.line + 10),
        Number.MAX_VALUE,
      ),
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
    context: vscode.InlineCompletionContext,
  ): string {
    const mainPrompt = MAIN_PROMPT_TEMPLATE.replace('{prefix}', prefix).replace(
      '{suffix}',
      suffix,
    );
    const triggerKind =
      context.triggerKind === vscode.InlineCompletionTriggerKind.Invoke
        ? 'manual'
        : 'automatic';

    return `${SYSTEM_PROMPT}\n\n<LANGUAGE>${languageName}</LANGUAGE>\n<TRIGGER_KIND>${triggerKind}</TRIGGER_KIND>\n${mainPrompt}`;
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

      mockLLMInvoke(prompt)
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
}
