import * as vscode from 'vscode';

import type {
  LanguageModelService,
  LoadedModelServices,
  ModelServiceType,
} from '../../types';
import type { HistoryManager, SettingsManager } from '../../api';
import { AnthropicService } from './anthropicService';
import { GeminiService } from './geminiService';
import { CohereService } from './cohereService';
import { OpenAIService } from './openaiService';
import { GroqService } from './groqService';
import { HuggingFaceService } from './huggingFaceService';
import { OllamaService } from './ollamaService';
import { CustomApiService } from './customApiService';

export class ModelServiceFactory {
  constructor(
    private ctx: vscode.ExtensionContext,
    private settingsManager: SettingsManager,
    private historyManager: HistoryManager,
  ) {}

  public createModelService(modelKey: ModelServiceType): LanguageModelService {
    switch (modelKey) {
      case 'anthropic':
        return new AnthropicService(
          this.ctx,
          this.settingsManager,
          this.historyManager,
        );
      case 'gemini':
        return new GeminiService(
          this.ctx,
          this.settingsManager,
          this.historyManager,
        );
      case 'cohere':
        return new CohereService(
          this.ctx,
          this.settingsManager,
          this.historyManager,
        );
      case 'openai':
        return new OpenAIService(
          this.ctx,
          this.settingsManager,
          this.historyManager,
        );
      case 'groq':
        return new GroqService(
          this.ctx,
          this.settingsManager,
          this.historyManager,
        );
      case 'huggingFace':
        return new HuggingFaceService(
          this.ctx,
          this.settingsManager,
          this.historyManager,
        );
      case 'ollama':
        return new OllamaService(
          this.ctx,
          this.settingsManager,
          this.historyManager,
        );
      case 'custom':
        return new CustomApiService(
          this.ctx,
          this.settingsManager,
          this.historyManager,
        );
      default:
        throw new Error(`Unsupported model: ${modelKey}`);
    }
  }

  public createModelServices(
    modelServiceKeys: ModelServiceType[],
  ): LoadedModelServices {
    const loadedModelServices: LoadedModelServices = {} as LoadedModelServices;

    for (const modelKey of modelServiceKeys) {
      loadedModelServices[modelKey] = {
        service: this.createModelService(modelKey),
      };
    }

    return loadedModelServices;
  }
}
