import { LanguageModelService } from './languageModelService';

/**
 * Represents the type of models supported by the system.
 */
export type ModelServiceType =
  | 'gemini'
  | 'openai'
  | 'cohere'
  | 'groq'
  | 'huggingFace'
  | 'ollama'
  | 'custom';

/**
 * Defines a structure for loaded models with detailed service and enabled status.
 */
export type LoadedModelServices = {
  [key in ModelServiceType]: {
    /**
     * The service for the model
     */
    service: LanguageModelService;

    /**
     * Determines if the model is enabled for code generation
     */
    enabled: boolean;
  };
};
