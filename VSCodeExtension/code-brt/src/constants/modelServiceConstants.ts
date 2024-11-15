import {
  ModelServiceType,
  TextToVoiceServiceType,
  type VoiceServiceType,
  VoiceToTextServiceType,
} from '../types';

export const AVAILABLE_MODEL_SERVICES: ModelServiceType[] = [
  'anthropic',
  'gemini',
  'openai',
  'cohere',
  'groq',
  'huggingFace',
  'ollama',
  'openRouter',
  'custom',
];

export const AVAILABLE_VOICE_SERVICES: VoiceServiceType[] = [
  'gptSoVits',
  'openai',
  'groq',
  'visualStudioCodeBuiltIn',
];

export const MODEL_SERVICE_CONSTANTS: {
  [key in Exclude<
    ModelServiceType | TextToVoiceServiceType | VoiceToTextServiceType,
    'not set'
  >]: {
    name: string;
    description: string;
    apiLink: string;
    color: string;
  };
} = {
  anthropic: {
    name: 'Anthropic (Claude)',
    description: 'Anthropic API Key',
    apiLink: 'https://console.anthropic.com/settings/keys',
    color: 'orange',
  },
  gemini: {
    name: 'Google (Gemini)',
    description: 'Google Gemini API Key',
    apiLink: 'https://ai.google.dev/gemini-api',
    color: 'blue',
  },
  openai: {
    name: 'OpenAI',
    description: 'OpenAI API Key',
    apiLink: 'https://platform.openai.com/api-keys',
    color: 'cyan',
  },
  cohere: {
    name: 'Cohere',
    description: 'Cohere API Key',
    apiLink:
      'https://dashboard.cohere.com/welcome/login?redirect_uri=%2Fapi-keys',
    color: 'green',
  },
  groq: {
    name: 'Groq',
    description: 'Groq API Key',
    apiLink: 'https://console.groq.com/keys',
    color: 'purple',
  },
  huggingFace: {
    name: 'HuggingFace',
    description: 'Hugging Face API Key',
    apiLink: 'https://huggingface.co/settings/tokens',
    color: 'gold',
  },
  ollama: {
    name: 'Ollama',
    description: 'Ollama Client Host',
    apiLink: 'https://ollama.com/download',
    color: 'magenta',
  },
  openRouter: {
    name: 'OpenRouter',
    description: 'OpenRouter API Key',
    apiLink: 'https://openrouter.ai/settings/keys',
    color: 'volcano',
  },
  custom: {
    name: 'Custom',
    description: 'Custom API Key',
    apiLink: '',
    color: 'lime',
  },
  gptSoVits: {
    name: 'GPT-SoVits',
    description:
      'A open source text-to-speech model with highly adjustable voice samples',
    apiLink: 'https://github.com/RVC-Boss/GPT-SoVITS',
    color: 'volcano',
  },
  visualStudioCodeBuiltIn: {
    name: 'VSCode Built-In',
    description:
      'Run on local CPU. ' +
      'It will open an temporary text file and close after input is done (Auto Closure after silence).' +
      'Sorry for but this must be done to use the built-in voice service, if you have any better idea please let us know! ',
    apiLink:
      'https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-speech',
    color: 'blue',
  },
};
