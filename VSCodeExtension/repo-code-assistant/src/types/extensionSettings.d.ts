import type * as hljs from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import { SpeechCreateParams } from 'openai/resources/audio';

import { ModelServiceType } from './modelServiceType';
import {
  TextToVoiceServiceType,
  VoiceToTextServiceType,
} from './voiceServiceType';

export type GptSoVitsVoiceSetting = {
  /**
   * Identifier for the voice setting.
   */
  id: string;

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
   * Identifier for the custom model.
   */
  id: string;

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

export type ExtensionSettingsLocal = {
  /**
   * The available models for the Anthropic API.
   */
  anthropicAvailableModels: string[];

  /**
   * The available models for the Gemini API.
   */
  geminiAvailableModels: string[];

  /**
   * The available models for the OpenAI API.
   */
  openaiAvailableModels: string[];

  /**
   * The available voices for the OpenAI API.
   */
  openaiAvailableVoices: SpeechCreateParams.voice[];

  /**
   * The selected voice for the OpenAI API.
   */
  openaiSelectedVoice: SpeechCreateParams.voice;

  /**
   * The available models for the Cohere API.
   */
  cohereAvailableModels: string[];

  /**
   * The available models for the Groq API.
   */
  groqAvailableModels: string[];

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
   * The last used model.
   */
  lastUsedModel: ModelServiceType;

  /**
   * The last selected model for each model service.
   */
  lastSelectedModel: {
    [keyof in ModelServiceType]: string;
  };

  /**
   * A list of custom models.
   */
  customModels: CustomModelSettings[];

  /**
   * The selected text-to-voice service.
   */
  selectedTextToVoiceService: TextToVoiceServiceType;

  /**
   * The selected voice-to-text service.
   */
  selectedVoiceToTextService: VoiceToTextServiceType;

  /**
   * The APIUrl for the GPT-SoVits model.
   */
  gptSoVitsClientHost: string;

  /**
   * The available reference voices for the GPT-SoVits API.
   */
  gptSoVitsAvailableReferenceVoices: GptSoVitsVoiceSetting[];

  /**
   * The selected reference voice for the GPT-SoVits API.
   */
  gptSoVitsSelectedReferenceVoice: string;
};

export type ExtensionSettingsCrossDevice = {
  /**
   * The API key for the Anthropic model.
   */
  anthropicApiKey: string;

  /**
   * The API key for the Cohere model.
   */
  cohereApiKey: string;

  /**
   * The API key for the Gemini model.
   */
  geminiApiKey: string;

  /**
   * The API key for the Groq model.
   */
  groqApiKey: string;

  /**
   * The API key for the Hugging Face model.
   */
  huggingFaceApiKey: string;

  /**
   * The API key for the OpenAI model.
   */
  openaiApiKey: string;

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

  /**
   * The theme for the code highlighter.
   */
  hljsTheme: keyof typeof hljs;
};

/**
 * Represents the settings for the extension.
 */
export type ExtensionSettings = ExtensionSettingsLocal &
  ExtensionSettingsCrossDevice;
