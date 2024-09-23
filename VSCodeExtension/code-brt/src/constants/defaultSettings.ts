import type {
  ExtensionSettings,
  ExtensionSettingsCrossDevice,
  ExtensionSettingsLocal,
  ExtensionSettingsWorkspace,
} from '../types';

export const DEFAULT_LOCAL_SETTINGS: ExtensionSettingsLocal = {
  anthropicAvailableModels: [
    'claude-3-5-sonnet-20240620',
    'claude-3-haiku-20240307',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
  ],
  openaiAvailableModels: [
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
  ],
  openaiAvailableVoices: ['nova', 'alloy', 'echo', 'fable', 'onyx', 'shimmer'],
  openaiSelectedVoice: 'nova',
  geminiAvailableModels: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'],
  cohereAvailableModels: ['command', 'command-r', 'command-r-plus'],
  groqAvailableModels: [
    'llama3-70b-8192',
    'llama3-8b-8192',
    'mixtral-8x7b-32768',
    'gemma-7b-it',
    'gemma2-9b-it',
  ],
  huggingFaceAvailableModels: ['HuggingFaceH4/zephyr-7b-beta'],
  ollamaClientHost: 'http://127.0.0.1:11434',
  ollamaAvailableModels: ['Auto Detect'],
  lastUsedModelService: 'gemini',
  lastSelectedModel: {
    gemini: 'gemini-1.5-pro-latest',
    anthropic: 'claude-3-5-sonnet-20240620',
    openai: 'gpt-3.5-turbo',
    cohere: 'command',
    groq: 'llama3-70b-8192',
    huggingFace: 'HuggingFaceH4/zephyr-7b-beta',
    ollama: 'Auto Detect',
    custom: '',
  },
  customModels: [],
  selectedVoiceToTextService: 'not set',
  selectedTextToVoiceService: 'not set',
  gptSoVitsClientHost: 'http://127.0.0.1:9880/',
  gptSoVitsAvailableReferenceVoices: [],
  gptSoVitsSelectedReferenceVoice: '',
  enableTools: {
    webSearch: { active: true },
    urlFetcher: { active: true },
  },
  systemPrompts: [],
  retainContextWhenHidden: false,
};
export const DEFAULT_WORKSPACE_SETTINGS: ExtensionSettingsWorkspace = {
  lastUsedHistoryID: '',
};
export const DEFAULT_CROSS_DEVICE_SETTINGS: ExtensionSettingsCrossDevice = {
  anthropicApiKey: '',
  openaiApiKey: '',
  geminiApiKey: '',
  cohereApiKey: '',
  groqApiKey: '',
  huggingFaceApiKey: '',
  doubleEnterSendMessages: false,
  themePrimaryColor: '#f0f0f0',
  themeAlgorithm: 'darkAlgorithm',
  themeBorderRadius: 4,
  hljsTheme: 'darcula',
};
export const DEFAULT_SETTINGS: ExtensionSettings = {
  ...DEFAULT_LOCAL_SETTINGS,
  ...DEFAULT_WORKSPACE_SETTINGS,
  ...DEFAULT_CROSS_DEVICE_SETTINGS,
};