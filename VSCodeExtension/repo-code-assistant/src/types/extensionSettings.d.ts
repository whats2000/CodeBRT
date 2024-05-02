import { ModelType } from "./modelType";

/**
 * Represents the settings for the extension.
 */
export type ExtensionSettings = {
  geminiApiKey: string;
  openAiApiKey: string;
  enableModel: {
    [key in ModelType]: boolean;
  }
}
