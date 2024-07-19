import axios, { AxiosResponse } from 'axios';
import vscode from 'vscode';

import type { GptSoVitsVoiceSetting } from '../../types';
import SettingsManager from '../../api/settingsManager';
import SoundPlay from '../../utils/audioPlayer';
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

    const voiceSettings =
      this.settingsManager.getGptSoVitsAvailableReferenceVoices();
    const selectedVoice = voiceSettings.find(
      (voice) =>
        voice.name ===
        this.settingsManager.get('selectedGptSoVitsReferenceVoice'),
    );

    this.updateSettings(selectedVoice);

    this.soundPlayer = new SoundPlay();
  }

  private updateSettings(
    selectedVoiceSettings: GptSoVitsVoiceSetting | undefined,
  ): void {
    if (selectedVoiceSettings) {
      this.referWavPath = selectedVoiceSettings.referWavPath;
      this.referText = selectedVoiceSettings.referText;
      this.promptLanguage = selectedVoiceSettings.promptLanguage;
    } else {
      this.referWavPath = '';
      this.referText = '';
      this.promptLanguage = '';
      console.log('No GPT-SoVits voice settings found. Please configure one.');
    }
  }

  protected async sendRequest(text: string): Promise<Uint8Array | string> {
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
        console.error(`API responded with status: ${response.status}`);
        return `API responded with status: ${response.status}`;
      }
    } catch (error) {
      console.error('Error during API call:', (error as Error).message);
      return (
        `Error during API call: ${(error as Error).message}, ` +
        `Please check the GPt-SoVits script is running at this address: ${this.settingsManager.get('gptSoVitsClientHost')}, ` +
        `and the voice settings are correctly configured at the voice settings page.`
      );
    }
  }

  /**
   * Switch the voice to the one with the given name
   * @param voiceName - The name of the voice to switch to
   */
  public async switchVoice(voiceName: string): Promise<void> {
    const voiceSettings =
      this.settingsManager.getGptSoVitsAvailableReferenceVoices();
    const selectedVoice = voiceSettings.find(
      (voice) => voice.name === voiceName,
    );

    if (!selectedVoice) {
      vscode.window.showErrorMessage(
        `Voice setting with name ${voiceName} not found`,
      );
      return;
    }

    this.settingsManager.selectGptSoVitsReferenceVoice(voiceName);
    this.updateSettings(selectedVoice);

    vscode.window.showInformationMessage(`Voice switched to ${voiceName}`);
  }
}
