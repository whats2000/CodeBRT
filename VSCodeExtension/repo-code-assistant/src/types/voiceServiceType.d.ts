import { VoiceService } from './voiceService';

export type VoiceServiceType = 'gptSoVits' | 'openai' | 'not set';

export type LoadedVoiceServices = {
  [key in Exclude<VoiceServiceType, 'not set'>]: {
    service: VoiceService;
  };
};
