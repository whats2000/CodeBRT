import { VoiceService } from '../../types/voiceService';
import { Promise } from 'promise-deferred';
import * as vscode from 'vscode';

import SettingsManager from '../../api/settingsManager';

export abstract class AbstractVoiceService implements VoiceService {
  protected settingsManager: SettingsManager;

  protected constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
  }

  public async textToVoice(_text: string): Promise<string> {
    vscode.window
      .showInformationMessage('Text to voice is not supported in this service')
      .then();

    return Promise.resolve('');
  }

  public async voiceToText(_voicePath: string): Promise<string> {
    vscode.window
      .showInformationMessage('Voice to text is not supported in this service')
      .then();

    return Promise.resolve('');
  }
}
