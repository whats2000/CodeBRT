import {
  ModelServiceType,
  TextToVoiceServiceType,
  VoiceToTextServiceType,
} from '../types';

export const MODEL_SERVICE_CONSTANTS: {
  [key in Exclude<
    ModelServiceType | TextToVoiceServiceType | VoiceToTextServiceType,
    'not set'
  >]: {
    name: string;
    description: string;
    apiLink: string;
  };
} = {
  anthropic: {
    name: 'Anthropic (Claude)',
    description: 'Anthropic API Key',
    apiLink: 'https://console.anthropic.com/settings/keys',
  },
  gemini: {
    name: 'Google (Gemini)',
    description: 'Google Gemini API Key',
    apiLink: 'https://ai.google.dev/gemini-api',
  },
  openai: {
    name: 'OpenAI',
    description: 'OpenAI API Key',
    apiLink: 'https://platform.openai.com/api-keys',
  },
  cohere: {
    name: 'Cohere',
    description: 'Cohere API Key',
    apiLink:
      'https://dashboard.cohere.com/welcome/login?redirect_uri=%2Fapi-keys',
  },
  groq: {
    name: 'Groq',
    description: 'Groq API Key',
    apiLink: 'https://console.groq.com/keys',
  },
  huggingFace: {
    name: 'HuggingFace',
    description: 'Hugging Face API Key',
    apiLink: 'https://huggingface.co/settings/tokens',
  },
  ollama: {
    name: 'Ollama',
    description: 'Ollama Client Host',
    apiLink: 'https://ollama.com/download',
  },
  custom: {
    name: 'Custom',
    description: 'Custom API Key',
    apiLink: '',
  },
  gptSoVits: {
    name: 'GPT-SoVits',
    description:
      'A open source text-to-speech model with highly adjustable voice samples',
    apiLink: 'https://github.com/RVC-Boss/GPT-SoVITS',
  },
  visualStudioCodeBuiltIn: {
    name: 'VSCode Built-In',
    description:
      'Run on local CPU. ' +
      'It will open an temporary text file and close after input is done (Auto Closure after silence).' +
      'Sorry for but this must be done to use the built-in voice service, if you have any better idea please let us know! ',
    apiLink:
      'https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-speech',
  },
};
