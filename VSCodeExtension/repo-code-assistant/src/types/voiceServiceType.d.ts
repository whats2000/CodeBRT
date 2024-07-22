import { VoiceService } from './voiceService';

export type TextToVoiceServiceType = 'gptSoVits' | 'openai' | 'not set';
export type VoiceToTextServiceType =
  | 'openai'
  | 'visualStudioCodeBuiltIn'
  | 'not set';

export type LoadedVoiceServices = {
  [key in Exclude<
    TextToVoiceServiceType | VoiceToTextServiceType,
    'not set'
  >]: {
    service: VoiceService;
  };
};
