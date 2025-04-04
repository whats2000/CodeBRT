import type * as hljs from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import { SpeechCreateParams } from 'openai/resources/audio';
import {
  TextToVoiceServiceType,
  VoiceToTextServiceType,
} from '../services/voice/types';
import { ModelServiceType } from '../services/languageModel/types';
import {
  NonWorkspaceToolType,
  WorkspaceToolType,
} from '../services/tools/types';
import { SupportedLanguage } from '../locales/i18n';

/**
 * Represents the available theme algorithms for the Ant Design theme.
 */
export type AvailableThemeAlgorithm =
  | 'defaultAlgorithm'
  | 'darkAlgorithm'
  | 'compactAlgorithm';

/**
 * A Tag object for categorizing System Prompts
 * @property color - The color associated with the tag
 * @property name - The name of the tag
 * @property description - A brief description of the tag
 */
export type Tag = {
  color: string;
  name: string;
  description: string;
};

/**
 * A System Prompt object for storing prompt details
 * @property id - A unique identifier for the system prompt
 * @property name - The name of the system prompt
 * @property description - A brief description of the system prompt
 * @property content - The actual prompt content
 * @property tags - An array of tags associated with the system prompt
 * @property createdAt - The timestamp when the prompt was created
 * @property updatedAt - The timestamp when the prompt was last updated
 */
export type SystemPrompt = {
  id: string;
  name: string;
  description: string;
  content: string;
  tags: Tag[];
  createdAt: number;
  updatedAt: number;
};

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
 * Represents the settings for an OpenRouter model.
 * @property uuid - The unique identifier of the OpenRouter model
 * @property id - The unique identifier of the OpenRouter model
 * @property name - A user-friendly name for the model
 * @property apiKey - The API key for the specific provider
 * @property created - The timestamp when the model was created
 * @property description - A brief description of the model
 * @property context_length - The context length of the model
 * @property architecture - The architecture of the model
 * @property pricing - The pricing details of the model
 * @property top_provider - The top provider details of the model
 * @property per_request_limits - The per-request limits of the model
 */
type OpenRouterModelSettings = {
  uuid: string;
  id: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  per_request_limits: number | null;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type: string | null;
  };
  pricing: {
    prompt: string;
    completion: string;
    image: string;
    request: string;
  };
  top_provider: {
    context_length: number | null;
    max_completion_tokens: number | null;
    is_moderated: boolean | null;
  };
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
 * @property deepseekAvailableModels - The available models for the Deepseek API
 * @property moonshotAvailableModels - The available models for the Moonshot API
 * @property ollamaClientHost - The host URL for the Ollama client
 * @property ollamaAvailableModels - The available models for the Ollama API
 * @property lastUsedModelService - The last used model service
 * @property lastSelectedModel - The last selected model for each model service
 * @property customModels - A list of custom models
 */
export type ModelServiceSettings = {
  anthropicAvailableModels: string[];
  geminiAvailableModels: string[];
  openaiAvailableModels: string[];
  openaiAvailableVoices: SpeechCreateParams.voice[];
  openaiSelectedVoice: SpeechCreateParams.voice;
  cohereAvailableModels: string[];
  groqAvailableModels: string[];
  huggingFaceAvailableModels: string[];
  deepseekAvailableModels: string[];
  moonshotAvailableModels: string[];
  ollamaClientHost: string;
  ollamaAvailableModels: string[];
  lastUsedModelService: ModelServiceType;
  lastSelectedModel: {
    [keyof in ModelServiceType]: string;
  };
  customModels: CustomModelSettings[];
  openRouterAvailableModels: string[];
  openRouterModels: OpenRouterModelSettings[];
};

/**
 * Represents the settings for the voice services.
 * @property selectedTextToVoiceService - The selected text-to-voice service
 * @property selectedVoiceToTextService - The selected voice-to-text service
 * @property gptSoVitsClientHost - The API URL for the GPT-SoVits model
 * @property gptSoVitsAvailableReferenceVoices - The available reference voices for the GPT-SoVits API
 * @property gptSoVitsSelectedReferenceVoice - The selected reference voice for the GPT-SoVits API
 */
export type VoiceServiceSettings = {
  selectedTextToVoiceService: TextToVoiceServiceType;
  selectedVoiceToTextService: VoiceToTextServiceType;
  gptSoVitsClientHost: string;
  gptSoVitsAvailableReferenceVoices: GptSoVitsVoiceSetting[];
  gptSoVitsSelectedReferenceVoice: string;
};

export type CodeCompletionSettings = {
  manualTriggerCodeCompletion: boolean;
  lastUsedManualCodeCompletionModelService: ModelServiceType;
  lastSelectedManualCodeCompletionModel: {
    [keyof in ModelServiceType]: string;
  };
  autoTriggerCodeCompletion: boolean;
  lastUsedAutoCodeCompletionModelService: ModelServiceType;
  lastSelectedAutoCodeCompletionModel: {
    [keyof in ModelServiceType]: string;
  };
};

/**
 * Represents the settings for the tool services.
 * @property enableTools - The enabled tools
 */
export type ToolServiceSettings = {
  enableTools: {
    [key in NonWorkspaceToolType | 'agentTools']: {
      active: boolean;
    };
  };
};

/**
 * Other local settings that are not related to the services.
 * @property systemPrompts - An array of system prompts
 * @property retainContextWhenHidden - Indicates whether the context should be retained when the extension is hidden
 * @property autoApproveActions - An array of actions that should be automatically approved
 * @property autoApproveExecuteCommandBlacklistRegex - If any command matches this regex, it will not be auto-approved
 */
export type OtherLocalSettings = {
  systemPrompts: SystemPrompt[];
  retainContextWhenHidden: boolean;
  autoApproveActions: (WorkspaceToolType | NonWorkspaceToolType)[];
  autoApproveExecuteCommandBlacklistRegex: string[];
};

/**
 * Represents the settings for the extension which are stored locally.
 * @property systemPrompts - An array of system prompts
 * @property retainContextWhenHidden - Indicates whether the context should be retained when the extension is hidden
 */
export type ExtensionSettingsLocal = ModelServiceSettings &
  VoiceServiceSettings &
  CodeCompletionSettings &
  ToolServiceSettings &
  OtherLocalSettings;

/**
 * Represents the settings for the extension which are stored in the workspace.
 * @property lastUsedHistoryID - The ID of the last used conversation history
 */
export type ExtensionSettingsWorkspace = {
  lastUsedHistoryID: string;
};

/**
 * Represents the settings for the extension which are stored cross-device.
 * @property anthropicApiKey - The API key for the Anthropic model
 * @property cohereApiKey - The API key for the Cohere model
 * @property geminiApiKey - The API key for the Gemini model
 * @property groqApiKey - The API key for the Groq model
 * @property huggingFaceApiKey - The API key for the Hugging Face model
 * @property openaiApiKey - The API key for the OpenAI model
 * @property doubleEnterSendMessages - Indicates whether pressing Enter twice should send messages
 * @property themePrimaryColor - The primary color for the Ant Design theme
 * @property themeAlgorithm - The algorithm for the Ant Design theme in (defaultAlgorithm, darkAlgorithm, compactAlgorithm)
 * @property themeBorderRadius - The border radius for the Ant Design theme
 * @property hljsTheme - The theme for the code highlighter
 */
export type ExtensionSettingsCrossDevice = {
  language: SupportedLanguage;
  anthropicApiKey: string;
  openaiApiKey: string;
  deepseekApiKey: string;
  moonshotApiKey: string;
  geminiApiKey: string;
  cohereApiKey: string;
  groqApiKey: string;
  huggingFaceApiKey: string;
  openRouterApiKey: string;
  doubleEnterSendMessages: boolean;
  themePrimaryColor: string;
  themeAlgorithm: AvailableThemeAlgorithm | AvailableThemeAlgorithm[];
  themeBorderRadius: number;
  hljsTheme: keyof typeof hljs;
};

/**
 * Represents the settings for the extension.
 */
export type ExtensionSettings = ExtensionSettingsLocal &
  ExtensionSettingsWorkspace &
  ExtensionSettingsCrossDevice;
