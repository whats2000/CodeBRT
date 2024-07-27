import { ExtensionSettings } from '../types';

export const MODEL_SERVICE_LINKS: {
  [key in keyof Partial<ExtensionSettings>]: string;
} = {
  anthropicApiKey: 'https://console.anthropic.com/settings/keys',
  cohereApiKey:
    'https://dashboard.cohere.com/welcome/login?redirect_uri=%2Fapi-keys',
  geminiApiKey: 'https://ai.google.dev/gemini-api',
  groqApiKey: 'https://console.groq.com/keys',
  huggingFaceApiKey: 'https://huggingface.co/settings/tokens',
  ollamaClientHost: 'https://ollama.com/download',
  openaiApiKey: 'https://platform.openai.com/api-keys',
  openaiAvailableVoices:
    'https://platform.openai.com/docs/guides/text-to-speech/voice-options',
  gptSoVitsClientHost: 'https://github.com/RVC-Boss/GPT-SoVITS',
};
