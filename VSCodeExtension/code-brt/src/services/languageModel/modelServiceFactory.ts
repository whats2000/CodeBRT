import * as vscode from 'vscode';

import type {
  LanguageModelService,
  LoadedModelServices,
  ModelServiceType,
} from './types';
import type { SettingsManager } from '../../api';
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
  ) {}

  public createModelService(modelKey: ModelServiceType): LanguageModelService {
    switch (modelKey) {
      case 'anthropic':
        return new AnthropicService(this.ctx, this.settingsManager);
      case 'gemini':
        return new GeminiService(this.ctx, this.settingsManager);
      case 'cohere':
        return new CohereService(this.ctx, this.settingsManager);
      case 'openai':
        return new OpenAIService(this.ctx, this.settingsManager);
      case 'groq':
        return new GroqService(this.ctx, this.settingsManager);
      case 'huggingFace':
        return new HuggingFaceService(this.ctx, this.settingsManager);
      case 'ollama':
        return new OllamaService(this.ctx, this.settingsManager);
      case 'custom':
        return new CustomApiService(this.ctx, this.settingsManager);
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
