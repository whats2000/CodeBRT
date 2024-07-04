import { ModelType } from './modelType';

export type GptSoVitsVoiceSetting = {
  /**
   * The name of the voice setting.
   */
  name: string;

  /**
   * The path to the WAV file.
   */
  referWavPath: string;

  /**
   * The text reference of the WAV file.
   */
  referText: string;

  /**
   * The language spoken in the WAV file.
   */
  promptLanguage: string;
};

/**
 * Represents the settings for a custom API model.
 */
export type CustomModelSettings = {
  /**
   * The name of the custom model.
   */
  name: string;

  /**
   * The URL of the API.
   */
  apiUrl: string;

  /**
   * The HTTP method to use (GET or POST).
   */
  apiMethod: 'GET' | 'POST';

  /**
   * The name of the text parameter in the API payload.
   */
  apiTextParam: string;

  /**
   * The name of the image parameter in the API payload.
   */
  apiImageParam: string;

  /**
   * The name of the query parameter in the API payload.
   */
  apiQueryParam: string;

  /**
   * Indicates whether the query should be included in the history.
   */
  includeQueryInHistory: boolean;
};

/**
 * Represents the settings for the extension.
 */
export type ExtensionSettings = {
  /**
   * The API key for the Gemini model.
   */
  geminiApiKey: string;

  /**
   * The available models for the Gemini API.
   */
  geminiAvailableModels: string[];

  /**
   * The API key for the OpenAI model.
   */
  openaiApiKey: string;

  /**
   * The available models for the OpenAI API.
   */
  openaiAvailableModels: string[];

  /**
   * The API key for the Cohere model.
   */
  cohereApiKey: string;

  /**
   * The available models for the Cohere API.
   */
  cohereAvailableModels: string[];

  /**
   * The API key for the Groq model.
   */
  groqApiKey: string;

  /**
   * The available models for the Groq API.
   */
  groqAvailableModels: string[];

  /**
   * The API key for the Hugging Face model.
   */
  huggingFaceApiKey: string;

  /**
   * The available models for the Hugging Face API.
   */
  huggingFaceAvailableModels: string[];

  /**
   * The host url for the Ollama client.
   */
  ollamaClientHost: string;

  /**
   * The available models for the Ollama API.
   */
  ollamaAvailableModels: string[];

  /**
   * The APIUrl for the GPT-SoVits model.
   */
  gptSoVitsApiUrl: string;

  /**
   * The available reference voices for the GPT-SoVits API.
   */
  gptSoVitsAvailableReferenceVoices: GptSoVitsVoiceSetting[];

  /**
   * The selected reference voice for the GPT-SoVits API.
   */
  selectedGptSoVitsReferenceVoice: string;

  /**
   * Determines if the model is enabled for code generation.
   */
  enableModel: {
    [key in ModelType]: boolean;
  };

  /**
   * The last used model.
   */
  lastUsedModel: ModelType;

  /**
   * A list of custom models.
   */
  customModels: CustomModelSettings[];

  /**
   * The name of the currently selected custom model.
   */
  selectedCustomModel: string;

  /**
   * The primary color for the Ant Design theme.
   */
  themePrimaryColor: string;

  /**
   * The algorithm for the Ant Design theme.
   */
  themeAlgorithm: 'defaultAlgorithm' | 'darkAlgorithm' | 'compactAlgorithm';

  /**
   * The border radius for the Ant Design theme.
   */
  themeBorderRadius: number;
};
