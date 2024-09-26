import { CodeFixerService } from './codeFixerService';

/**
 * Represents the type of models supported by the system.
 */
export type CodeFixerModelServiceType =
  | 'anthropic'
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
export type CodeFixerLoadedModelServices = {
  [key in CodeFixerModelServiceType]: {
    service: CodeFixerService;
  };
};
