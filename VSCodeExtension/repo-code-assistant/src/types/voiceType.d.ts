import { VoiceService } from './voiceService';

export type VoiceType = 'gptSoVits' | 'not set';

export type LoadedVoiceService = {
  [key in Exclude<VoiceType, 'not set'>]: {
    service: VoiceService;
  };
};
