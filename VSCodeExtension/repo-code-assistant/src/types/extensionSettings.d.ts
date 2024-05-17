import { ModelType } from "./modelType";

/**
 * Represents the settings for the extension.
 */
export type ExtensionSettings = {
  /**
   * The API key for the Gemini model
   */
  geminiApiKey: string;

  /**
   * The API key for the OpenAI model
   */
  openAiApiKey: string;

  /**
   * The API key for the Cohere model
   */
  cohereApiKey: string;

  /**
   * Determines if the model is enabled for code generation
   */
  enableModel: {
    [key in ModelType]: boolean;
  },

  /**
   * The last used model
   */
  lastUsedModel: ModelType;
}
