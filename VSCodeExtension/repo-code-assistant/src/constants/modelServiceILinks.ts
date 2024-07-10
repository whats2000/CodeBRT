import { ExtensionSettings } from '../types';

export const MODEL_SERVICE_LINKS: {
  [key in keyof Partial<ExtensionSettings>]: string;
} = {
  cohereApiKey:
    'https://dashboard.cohere.com/welcome/login?redirect_uri=%2Fapi-keys',
  geminiApiKey: 'https://ai.google.dev/gemini-api',
  groqApiKey: 'https://console.groq.com/keys',
  huggingFaceApiKey: 'https://huggingface.co/settings/tokens',
  ollamaClientHost: 'https://ollama.com/download',
  openaiApiKey: 'https://platform.openai.com/api-keys',
  gptSoVitsClientHost: 'https://github.com/RVC-Boss/GPT-SoVITS',
};
