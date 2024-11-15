import { LanguageModelService } from './index';

/**
 * Represents the type of models supported by the system.
 */
export type ModelServiceType =
  | 'anthropic'
  | 'gemini'
  | 'openai'
  | 'cohere'
  | 'groq'
  | 'huggingFace'
  | 'ollama'
  | 'openRouter'
  | 'custom';

/**
 * Defines a structure for loaded models with detailed service and enabled status.
 */
export type LoadedModelServices = {
  [key in ModelServiceType]: {
    service: LanguageModelService;
  };
};

export type GetResponseOptions = {
  query: string;
  images?: string[];
  currentEntryID?: string;
  sendStreamResponse?: (message: string) => void;
  updateStatus?: (status: string) => void;
};
