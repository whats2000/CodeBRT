import * as vscode from 'vscode';
import { Ollama } from 'ollama';
import { SettingsManager } from '../../api';
import { AutocompleteContext, AutocompleteSuggestion } from './types';
import { ContextCollector } from '../autoComplete/ContextCollector';

export class OllamaAutoCompleteService {
  private ollamaClient: Ollama;
  private currentModel: string;

  constructor(
    private settingsManager: SettingsManager,
    private contextCollector: ContextCollector,
  ) {
    this.ollamaClient = new Ollama({
      host: this.settingsManager.get('ollamaClientHost'),
    });
    this.currentModel = this.settingsManager.get('lastSelectedModel').ollama;
  }

  async getCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<AutocompleteSuggestion[]> {
    const context = await this.contextCollector.collectContext(
      document.uri.fsPath,
      { line: position.line, character: position.character },
      document.getText(),
    );

    const prompt = this.constructPrompt(context);

    console.log('Prompt sent to Ollama:', prompt);
    console.log('Context collected:', context);
    console.log('Prompt sent to Ollama:', prompt);
    try {
      const response = await this.ollamaClient.generate({
        model: this.currentModel,
        prompt: prompt,
      });
      console.log('Raw response from Ollama:', response.response);

      return this.parseCompletions(response.response);
    } catch (error) {
      console.error('Error getting Ollama completion:', error);
      return [];
    }
  }

  private constructPrompt(context: AutocompleteContext): string {
    // 保持原有的 constructPrompt 邏輯
    return `Given the following context:
File: ${context.filepath}
Language: ${context.language?.name}
Prefix: ${context.prefix}
Suffix: ${context.suffix}
Imported symbols: ${context.importedSymbols.map((s) => `${s.name} (${s.kind}) from ${s.sourcePath}`).join(', ')}
Nearby symbols: ${context.nearbySymbols.map((s) => `${s.name} (${s.kind})`).join(', ')}
Current symbol: ${context.currentSymbol ? `${context.currentSymbol.name} (${context.currentSymbol.kind})` : 'None'}
Recent edits: ${context.recentEdits.map((e) => `[${e.range.start.line}:${e.range.start.character}-${e.range.end.line}:${e.range.end.character}] ${e.content.substring(0, 50)}...`).join(', ')}
Relevant code snippets: 
${context.relevantCodeSnippets
  .slice(0, 3)
  .map((s) => `---\n${s.content}\n---`)
  .join('\n')}
Project symbols: ${context.projectSymbols.slice(0, 10).join(', ')}
Similar code: 
${context.similarCode
  .slice(0, 2)
  .map((s) => `---\n${s.content}\n---`)
  .join('\n')}
Enclosing function: ${context.enclosingFunction ? JSON.stringify(context.enclosingFunction) : 'None'}
Data flow info: ${JSON.stringify(context.dataFlowInfo)}

Based on this context, please provide 3-5 autocomplete suggestions to continue the code. Each suggestion should be relevant, contextually appropriate, and follow the coding style and patterns evident in the given context. Format each suggestion as "suggestion: <text>|<description>|<kind>"`;
  }

  private parseCompletions(response: string): AutocompleteSuggestion[] {
    console.log('Response from Ollama:', response);
    const lines = response.split('\n');
    return lines
      .filter((line) => line.startsWith('suggestion:'))
      .map((line) => {
        const [text, description, kind] = line
          .slice('suggestion:'.length)
          .trim()
          .split('|');
        return {
          text: text.trim(),
          description: description?.trim(),
          kind: kind?.trim(),
        };
      });
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.ollamaClient.list();
      return response.models.map((model) => model.name);
    } catch (error) {
      console.error('Error getting available models:', error);
      return [];
    }
  }

  async switchModel(modelName: string): Promise<void> {
    this.currentModel = modelName;
    await this.settingsManager.set('lastSelectedModel', {
      ...this.settingsManager.get('lastSelectedModel'),
      ollama: modelName,
    });
  }

  public updateClientHost(newHost: string): void {
    this.ollamaClient = new Ollama({ host: newHost });
    this.settingsManager.set('ollamaClientHost', newHost);
  }
}
