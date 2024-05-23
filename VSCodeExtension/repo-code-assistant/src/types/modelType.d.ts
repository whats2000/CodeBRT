import { LanguageModelService } from "./languageModelService";

/**
 * Represents the type of models supported by the system.
 */
export type ModelType = "gemini" | "openai" | "cohere" | "groq";

/**
 * Defines a structure for loaded models with detailed service and enabled status.
 */
export type LoadedModels = {
  [key in modelType]: {
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
