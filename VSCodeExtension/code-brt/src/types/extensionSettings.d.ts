import type * as hljs from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import { SpeechCreateParams } from 'openai/resources/audio';

import { ModelServiceType } from './modelServiceType';
import {
  TextToVoiceServiceType,
  VoiceToTextServiceType,
} from './voiceServiceType';
import { ToolServiceType } from './toolServicesType';

/**
 * Represents the settings for a reference voice for the GPT-SoVits API.
 * @property id - Identifier for the voice setting
 * @property name - The name of the voice setting
 * @property referWavPath - The path to the WAV file
 * @property referText - The text reference of the WAV file
 * @property promptLanguage - The language spoken in the WAV file in (zh, en, ja)
 */
export type GptSoVitsVoiceSetting = {
  id: string;
  name: string;
  referWavPath: string;
  referText: string;
  promptLanguage: 'zh' | 'en' | 'ja';
};

/**
 * Represents the settings for a custom API model.
 * @property id - Identifier for the custom model
 * @property name - The name of the custom model
 * @property apiUrl - The URL of the API
 * @property apiMethod - The HTTP method to use (GET or POST)
 * @property apiTextParam - The name of the text parameter in the API payload
 * @property apiImageParam - The name of the image parameter in the API payload
 * @property apiQueryParam - The name of the query parameter in the API payload
 * @property includeQueryInHistory - Indicates whether the query should be included in the history
 */
export type CustomModelSettings = {
  id: string;
  name: string;
  apiUrl: string;
  apiMethod: 'GET' | 'POST';
  apiTextParam: string;
  apiImageParam: string;
  apiQueryParam: string;
  includeQueryInHistory: boolean;
};

/**
 * Represents the settings for the extension which are stored locally.
 * @property anthropicAvailableModels - The available models for the Anthropic API
 * @property geminiAvailableModels - The available models for the Gemini API
 * @property openaiAvailableModels - The available models for the OpenAI API
 * @property openaiAvailableVoices - The available voices for the OpenAI API
 * @property openaiSelectedVoice - The selected voice for the OpenAI API
 * @property cohereAvailableModels - The available models for the Cohere API
 * @property groqAvailableModels - The available models for the Groq API
 * @property huggingFaceAvailableModels - The available models for the Hugging Face API
 * @property ollamaClientHost - The host URL for the Ollama client
 * @property ollamaAvailableModels - The available models for the Ollama API
 * @property lastUsedModel - The last used model
 * @property lastSelectedModel - The last selected model for each model service
 * @property customModels - A list of custom models
 * @property selectedTextToVoiceService - The selected text-to-voice service
 * @property selectedVoiceToTextService - The selected voice-to-text service
 * @property gptSoVitsClientHost - The API URL for the GPT-SoVits model
 * @property gptSoVitsAvailableReferenceVoices - The available reference voices for the GPT-SoVits API
 * @property gptSoVitsSelectedReferenceVoice - The selected reference voice for the GPT-SoVits API
 */
export type ExtensionSettingsLocal = {
  anthropicAvailableModels: string[];
  geminiAvailableModels: string[];
  openaiAvailableModels: string[];
  openaiAvailableVoices: SpeechCreateParams.voice[];
  openaiSelectedVoice: SpeechCreateParams.voice;
  cohereAvailableModels: string[];
  groqAvailableModels: string[];
  huggingFaceAvailableModels: string[];
  ollamaClientHost: string;
  ollamaAvailableModels: string[];
  lastUsedModel: ModelServiceType;
  lastSelectedModel: {
    [keyof in ModelServiceType]: string;
  };
  customModels: CustomModelSettings[];
  selectedTextToVoiceService: TextToVoiceServiceType;
  selectedVoiceToTextService: VoiceToTextServiceType;
  gptSoVitsClientHost: string;
  gptSoVitsAvailableReferenceVoices: GptSoVitsVoiceSetting[];
  gptSoVitsSelectedReferenceVoice: string;
  enableTools: {
    [key in ToolServiceType]: {
      active: boolean;
    };
  };
};

/**
 * Represents the settings for the extension which are stored cross-device.
 * @property anthropicApiKey - The API key for the Anthropic model
 * @property cohereApiKey - The API key for the Cohere model
 * @property geminiApiKey - The API key for the Gemini model
 * @property groqApiKey - The API key for the Groq model
 * @property huggingFaceApiKey - The API key for the Hugging Face model
 * @property openaiApiKey - The API key for the OpenAI model
 * @property themePrimaryColor - The primary color for the Ant Design theme
 * @property themeAlgorithm - The algorithm for the Ant Design theme in (defaultAlgorithm, darkAlgorithm, compactAlgorithm)
 * @property themeBorderRadius - The border radius for the Ant Design theme
 * @property hljsTheme - The theme for the code highlighter
 */
export type ExtensionSettingsCrossDevice = {
  anthropicApiKey: string;
  cohereApiKey: string;
  geminiApiKey: string;
  groqApiKey: string;
  huggingFaceApiKey: string;
  openaiApiKey: string;
  themePrimaryColor: string;
  themeAlgorithm: 'defaultAlgorithm' | 'darkAlgorithm' | 'compactAlgorithm';
  themeBorderRadius: number;
  hljsTheme: keyof typeof hljs;
};

/**
 * Represents the settings for the extension.
 */
export type ExtensionSettings = ExtensionSettingsLocal &
  ExtensionSettingsCrossDevice;
