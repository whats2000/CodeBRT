import { VoiceService } from './voiceService';
import { GptSoVitsApiService } from '../services/Voice';

export type VoiceServiceType = 'gptSoVits' | 'openai' | 'not set';

export type LoadedVoiceServices = {
  [key in Exclude<VoiceServiceType, 'not set'>]: {
    service: VoiceService;
  };
};
