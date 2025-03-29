import type {
  ExtensionSettings,
  ExtensionSettingsCrossDevice,
  ExtensionSettingsLocal,
  ExtensionSettingsWorkspace,
} from '../types';

export const DEFAULT_LOCAL_SETTINGS: ExtensionSettingsLocal = {
  anthropicAvailableModels: [
    'claude-3-5-sonnet-latest',
    'claude-3-5-haiku-latest',
    'claude-3-opus-latest',
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
  moonshotAvailableModels: [
    'moonshot-v1-auto',
    'moonshot-v1-8k',
    'moonshot-v1-32k',
    'moonshot-v1-128k',
  ],
  geminiAvailableModels: [
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash-latest',
  ],
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
    gemini: 'gemini-1.5-flash',
    anthropic: 'claude-3-5-sonnet-latest',
    openai: 'gpt-4o-mini',
    moonshot: 'moonshot-v1-auto',
    cohere: 'command',
    groq: 'llama3-70b-8192',
    huggingFace: 'HuggingFaceH4/zephyr-7b-beta',
    ollama: 'Auto Detect',
    openRouter: '',
    custom: '',
  },
  customModels: [],
  openRouterAvailableModels: [],
  openRouterModels: [],
  selectedVoiceToTextService: 'not set',
  selectedTextToVoiceService: 'not set',
  gptSoVitsClientHost: 'http://127.0.0.1:9880/',
  gptSoVitsAvailableReferenceVoices: [],
  gptSoVitsSelectedReferenceVoice: '',
  enableTools: {
    webSearch: { active: true },
    urlFetcher: { active: true },
    agentTools: { active: true },
  },
  systemPrompts: [],
  retainContextWhenHidden: false,
  autoApproveActions: [],
  autoApproveExecuteCommandBlacklistRegex: [
    // Linux / Unix dangerous
    'sudo\\s+.*',
    'rm\\s+-rf\\s+.*',
    'rm\\s+-r\\s+.*',
    'chmod\\s+777\\s+.*',
    'mkfs\\..*',
    'dd\\s+if=.*',
    '>\\s*/dev/.*',
    'eval\\s+.*',
    ':\\(\\)\\s*\\{\\s*:\\|:\\s*;&\\s*\\};\\s*.*',

    // Windows admin removal
    'format\\s+.*',
    'del\\s+/f\\s+/s\\s+/q\\s+.*',
    'Remove-Item\\s+.*-Recurse\\s+-Force',

    // Docker dangerous
    'docker\\s+rm\\s+.*',
    'docker\\s+rmi\\s+.*',
    'docker\\s+volume\\s+rm\\s+.*',
    'docker\\s+exec\\s+.*\\s+rm\\s+.*',

    // Kubernetes dangerous
    'kubectl\\s+delete\\s+.*',
    'kubectl\\s+exec\\s+.*\\s+--\\s+rm\\s+.*',

    // Git destructive
    'git\\s+reset\\s+--hard',
    'git\\s+clean\\s+-fd',

    // Shell-based remote execution
    'wget\\s+.*\\|\\s*sh',
    'curl\\s+.*\\|\\s*sh',
    'echo\\s+.*\\|\\s*base64\\s+-d\\s*\\|\\s*sh',
    'base64\\s+-d\\s+.*\\|\\s*sh',
  ],
  manualTriggerCodeCompletion: false,
  lastUsedManualCodeCompletionModelService: 'gemini',
  lastSelectedManualCodeCompletionModel: {
    gemini: 'gemini-1.5-flash',
    anthropic: 'claude-3-5-sonnet-latest',
    openai: 'gpt-4o-mini',
    moonshot: 'moonshot-v1-8k',
    cohere: 'command',
    groq: 'llama3-70b-8192',
    huggingFace: 'HuggingFaceH4/zephyr-7b-beta',
    openRouter: '',
    ollama: 'Auto Detect',
    custom: '',
  },
  autoTriggerCodeCompletion: false,
  lastUsedAutoCodeCompletionModelService: 'ollama',
  lastSelectedAutoCodeCompletionModel: {
    gemini: 'gemini-1.5-flash',
    anthropic: 'claude-3-5-sonnet-latest',
    openai: 'gpt-4o-mini',
    moonshot: 'moonshot-v1-8k',
    cohere: 'command',
    groq: 'llama3-70b-8192',
    huggingFace: 'HuggingFaceH4/zephyr-7b-beta',
    ollama: 'starcoder2',
    openRouter: '',
    custom: '',
  },
};
export const DEFAULT_WORKSPACE_SETTINGS: ExtensionSettingsWorkspace = {
  lastUsedHistoryID: '',
};
export const DEFAULT_CROSS_DEVICE_SETTINGS: ExtensionSettingsCrossDevice = {
  language: 'en-US',
  anthropicApiKey: '',
  openaiApiKey: '',
  moonshotApiKey: '',
  geminiApiKey: '',
  cohereApiKey: '',
  groqApiKey: '',
  huggingFaceApiKey: '',
  openRouterApiKey: '',
  doubleEnterSendMessages: false,
  themePrimaryColor: '#007ACC',
  themeAlgorithm: 'darkAlgorithm',
  themeBorderRadius: 4,
  hljsTheme: 'darcula',
};
export const DEFAULT_SETTINGS: ExtensionSettings = {
  ...DEFAULT_LOCAL_SETTINGS,
  ...DEFAULT_WORKSPACE_SETTINGS,
  ...DEFAULT_CROSS_DEVICE_SETTINGS,
};
