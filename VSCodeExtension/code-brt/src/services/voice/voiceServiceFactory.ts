import vscode from 'vscode';

import type { SettingsManager } from '../../api';
import { LoadedVoiceServices, VoiceService, VoiceServiceType } from './types';
import { GptSoVitsApiService } from './gptSoVitsService';
import { OpenaiVoiceService } from './openaiVoiceService';
import { VisualStudioCodeBuiltInService } from './visualStudioCodeBuildInService';
import { GroqVoiceService } from './groqVoiceService';

export class VoiceServiceFactory {
  constructor(
    private ctx: vscode.ExtensionContext,
    private settingsManager: SettingsManager,
  ) {}

  public createVoiceService(modelKey: VoiceServiceType): VoiceService {
    switch (modelKey) {
      case 'gptSoVits':
        return new GptSoVitsApiService(this.ctx, this.settingsManager);
      case 'openai':
        return new OpenaiVoiceService(this.ctx, this.settingsManager);
      case 'groq':
        return new GroqVoiceService(this.ctx, this.settingsManager);
      case 'visualStudioCodeBuiltIn':
        return new VisualStudioCodeBuiltInService(
          this.ctx,
          this.settingsManager,
        );
      default:
        throw new Error(`Voice service type ${modelKey} is not supported.`);
    }
  }

  public createVoiceServices(
    modelServiceKeys: VoiceServiceType[],
  ): LoadedVoiceServices {
    const voiceServices: LoadedVoiceServices = {} as LoadedVoiceServices;

    for (const modelServiceKey of modelServiceKeys) {
      voiceServices[modelServiceKey] = {
        service: this.createVoiceService(modelServiceKey),
      };
    }

    return voiceServices;
  }
}
