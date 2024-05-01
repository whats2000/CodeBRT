import { ModelType } from "./modelType";

export interface ExtensionSettings {
  geminiApiKey: string;
  openAiApiKey: string;
  enableModel: {
    [key in ModelType]: boolean;
  }
}
