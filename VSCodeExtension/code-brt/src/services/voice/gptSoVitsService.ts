import axios, { AxiosResponse } from 'axios';
import vscode from 'vscode';

import type { GptSoVitsVoiceSetting } from '../../types';
import { MODEL_SERVICE_LINKS } from '../../constants';
import { SettingsManager } from '../../api';
import { AbstractVoiceService } from './abstractVoiceService';

export class GptSoVitsApiService extends AbstractVoiceService {
  private referWavPath: string = '';
  private referText: string = '';
  private promptLanguage: string = '';

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    super(context, settingsManager);

    const voiceSettings = this.settingsManager.get(
      'gptSoVitsAvailableReferenceVoices',
    );
    const selectedVoice = voiceSettings.find(
      (voice) =>
        voice.name ===
        this.settingsManager.get('gptSoVitsSelectedReferenceVoice'),
    );

    this.updateSettings(selectedVoice);
  }

  private updateSettings(selectedVoiceSettings?: GptSoVitsVoiceSetting): void {
    if (selectedVoiceSettings) {
      this.referWavPath = selectedVoiceSettings.referWavPath;
      this.referText = selectedVoiceSettings.referText;
      this.promptLanguage = selectedVoiceSettings.promptLanguage;
    } else {
      this.referWavPath = '';
      this.referText = '';
      this.promptLanguage = '';
    }
  }

  protected async sendTextToVoiceRequest(
    text: string,
  ): Promise<Uint8Array | undefined> {
    const requestData = {
      refer_wav_path: this.referWavPath,
      ref_audio_path: this.referWavPath,
      prompt_text: this.referText,
      prompt_language: this.promptLanguage,
      prompt_lang: this.promptLanguage,
      text: text,
      text_language: this.promptLanguage,
      text_lang: this.promptLanguage,
    };

    try {
      const response: AxiosResponse<ArrayBuffer> = await axios.post(
        `${this.settingsManager.get('gptSoVitsClientHost')}`,
        requestData,
        {
          responseType: 'arraybuffer',
        },
      );

      if (response.status === 200) {
        return new Uint8Array(response.data);
      } else {
        vscode.window.showErrorMessage(
          `API responded with status: ${response.status}`,
        );
        return;
      }
    } catch (error) {
      vscode.window
        .showErrorMessage(
          `Error during API call: ${(error as Error).message}, ` +
            `Please check the GPt-SoVits script is running at this address: ${this.settingsManager.get('gptSoVitsClientHost')}, ` +
            `Check out the GPT-SoVits advanced settings in voice settings. ` +
            `Additional: The voice must in 3s to 10s range. ` +
            `And if your facing mp3 issue try converting it to wav (Mostly work!).`,
          'Download GPT-SoVits script',
        )
        .then((selection) => {
          if (selection === 'Download GPT-SoVits script') {
            vscode.env.openExternal(
              vscode.Uri.parse(
                MODEL_SERVICE_LINKS.gptSoVitsClientHost as string,
              ),
            );
          }
        });
      return;
    }
  }

  /**
   * Switch the voice to the one with the given name
   * @param voiceName - The name of the voice to switch to
   */
  public async switchVoice(voiceName: string): Promise<void> {
    const voiceSettings = this.settingsManager.get(
      'gptSoVitsAvailableReferenceVoices',
    );

    if (voiceName === '') {
      this.updateSettings();
      return;
    }

    const selectedVoice = voiceSettings.find(
      (voice) => voice.name === voiceName,
    );

    if (!selectedVoice) {
      vscode.window.showErrorMessage(
        `Voice setting with name ${voiceName} not found`,
      );
      this.updateSettings();
      return;
    }

    this.settingsManager
      .set('gptSoVitsSelectedReferenceVoice', voiceName)
      .then();
    this.updateSettings(selectedVoice);

    vscode.window.showInformationMessage(`Voice switched to ${voiceName}`);
  }
}
