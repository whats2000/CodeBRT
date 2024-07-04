import axios, { AxiosResponse } from 'axios';
import vscode from 'vscode';

import SettingsManager from '../../api/settingsManager';
import { AbstractVoiceService } from './abstractVoiceService';
import { GptSoVitsVoiceSetting } from '../../types/extensionSettings';

export class GptSoVitsApiService extends AbstractVoiceService {
  private readonly apiUrl: string;
  private readonly referWavPath: string;
  private readonly referText: string;
  private readonly promptLanguage: string;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    super();
  }

  public async textToVoice(text: string): Promise<string> {
    return '';
  }

  private async sendRequest(text: string): Promise<Uint8Array | string> {
    const requestData = {
      refer_wav_path: this.referWavPath,
      prompt_text: this.referText,
      prompt_language: this.promptLanguage,
      text: text,
      text_language: this.promptLanguage,
    };

    try {
      const response: AxiosResponse<ArrayBuffer> = await axios.post(
        `${this.apiUrl}/`,
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
      return `Error during API call: ${(error as Error).message}`;
    }
  }
}
