import { AbstractLanguageModelService } from "../services/abstractLanguageModelService";

/**
 * Represents the type of models supported by the system.
 */
export type ModelType = "gemini" | "gpt3" | "gpt4" | "cohere";

/**
 * Defines a structure for loaded models with detailed service and enabled status.
 */
export type LoadedModels = {
  [key in modelType]: {
    service: AbstractLanguageModelService;
    enabled: boolean;
  };
}
