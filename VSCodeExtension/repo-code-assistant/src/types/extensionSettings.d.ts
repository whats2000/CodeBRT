export interface ExtensionSettings {
  geminiApiKey: string;
  openAiApiKey: string;
  enableModel: {
    gemini: boolean;
    gpt3: boolean;
    gpt4: boolean;
  }
}
