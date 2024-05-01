import { AbstractLanguageModelService } from "../services/abstractLanguageModelService";

export type ModelType = "gemini" | "gpt3" | "gpt4"

export type Models = {
  [key in modelType]: {
    service: AbstractLanguageModelService;
    enabled: boolean;
  };
}
