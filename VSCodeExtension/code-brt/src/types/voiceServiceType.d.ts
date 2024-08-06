import { VoiceService } from './voiceService';

export type TextToVoiceServiceType = 'gptSoVits' | 'openai' | 'not set';
export type VoiceToTextServiceType =
  | 'groq'
  | 'openai'
  | 'visualStudioCodeBuiltIn'
  | 'not set';

/**
 * Defines a structure for loaded voice services with detailed service.
 * The key is the service type and the value is the service object.
 */
export type LoadedVoiceServices = {
  [key in Exclude<
    TextToVoiceServiceType | VoiceToTextServiceType,
    'not set'
  >]: {
    service: VoiceService;
  };
};
