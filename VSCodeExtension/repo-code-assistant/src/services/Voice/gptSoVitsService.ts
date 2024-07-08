import axios, { AxiosResponse } from 'axios';
import vscode from 'vscode';
import fs from 'node:fs/promises';

import SettingsManager from '../../api/settingsManager';
import { AbstractVoiceService } from './abstractVoiceService';
import SoundPlay from '../../utils/audioPlayer';

export class GptSoVitsApiService extends AbstractVoiceService {
  private clientHost: string;
  private referWavPath: string = '';
  private referText: string = '';
  private promptLanguage: string = '';
  private readonly settingsListener: vscode.Disposable;
  private textToVoiceQueue: string[] = [];
  private voicePlaybackQueue: string[] = [];
  private isTextToVoiceProcessing: boolean = false;
  private isVoicePlaying: boolean = false;
  private shouldStopPlayback: boolean = false;
  private soundPlayer: SoundPlay;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    super(context, settingsManager);

    this.updateSettings();

    this.clientHost = settingsManager.get('gptSoVitsClientHost');
    this.soundPlayer = new SoundPlay();

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration('repo-code-assistant.gptSoVitsClientHost') ||
        e.affectsConfiguration(
          'repo-code-assistant.gptSoVitsAvailableReferenceVoices',
        ) ||
        e.affectsConfiguration(
          'repo-code-assistant.selectedGptSoVitsReferenceVoice',
        )
      ) {
        this.updateSettings();
        this.clientHost = settingsManager.get('gptSoVitsClientHost');
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private updateSettings(): void {
    const selectedVoiceSettings =
      this.settingsManager.getSelectedGptSoVitsReferenceVoice();

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
        `${this.clientHost}`,
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

  private async processTextToVoiceQueue(): Promise<void> {
    if (this.isTextToVoiceProcessing || this.textToVoiceQueue.length === 0) {
      return;
    }

    this.isTextToVoiceProcessing = true;

    while (this.textToVoiceQueue.length > 0) {
      const textChunk = this.textToVoiceQueue.shift()!;
      const response = await this.sendRequest(this.preprocessText(textChunk));

      if (typeof response === 'string') {
        vscode.window.showErrorMessage(response);
        this.isTextToVoiceProcessing = false;
        return;
      }

      if (this.shouldStopPlayback) {
        this.isTextToVoiceProcessing = false;
        return;
      }

      const voicePath = await this.saveVoice(response as Uint8Array);

      this.voicePlaybackQueue.push(voicePath);
      this.processVoicePlaybackQueue().then();
    }

    this.isTextToVoiceProcessing = false;
  }

  private async processVoicePlaybackQueue(): Promise<void> {
    if (this.isVoicePlaying || this.voicePlaybackQueue.length === 0) {
      return;
    }

    this.isVoicePlaying = true;

    while (this.voicePlaybackQueue.length > 0) {
      if (this.shouldStopPlayback) {
        this.voicePlaybackQueue.forEach((filePath) => {
          fs.unlink(filePath).catch((error) =>
            console.error(`Failed to delete voice file: ${error}`),
          );
        });
        this.voicePlaybackQueue = [];
        break;
      }

      const voicePath = this.voicePlaybackQueue.shift()!;

      try {
        await this.soundPlayer.play(voicePath).finally(() =>
          setTimeout(() => {
            fs.unlink(voicePath).catch((error) =>
              console.error(`Failed to delete voice file: ${error}`),
            );
          }, 500),
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to play voice: ${error}`);
        this.isVoicePlaying = false;
        return;
      }
    }

    this.isVoicePlaying = false;
  }

  public async textToVoice(text: string): Promise<void> {
    this.shouldStopPlayback = false;

    return new Promise<void>((resolve, reject) => {
      const textChunks = this.splitTextIntoChunks(
        this.removeCodeReferences(text),
      );
      this.textToVoiceQueue.push(...textChunks);
      this.processTextToVoiceQueue()
        .then(() => {
          const interval = setInterval(() => {
            if (!this.isTextToVoiceProcessing && !this.isVoicePlaying) {
              clearInterval(interval);
              resolve();
            }
          }, 100);
        })
        .catch(reject);
    });
  }

  public async stopVoice(): Promise<void> {
    this.shouldStopPlayback = true;
    this.textToVoiceQueue = [];
    this.soundPlayer.stop();
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
    this.referWavPath = selectedVoice.referWavPath;
    this.referText = selectedVoice.referText;
    this.promptLanguage = selectedVoice.promptLanguage;

    vscode.window.showInformationMessage(`Voice switched to ${voiceName}`);
  }
}
