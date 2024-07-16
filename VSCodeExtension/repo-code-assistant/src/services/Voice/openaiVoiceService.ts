import { AbstractVoiceService } from './abstractVoiceService';
import vscode from 'vscode';
import OpenAI from 'openai';
import fs from 'node:fs/promises';
import * as fs1 from 'node:fs';
import SoundPlay from '../../utils/audioPlayer';

import SettingsManager from '../../api/settingsManager';

export class OpenaiVoiceService extends AbstractVoiceService {
  private apiKey: string = this.settingsManager.get('openaiApiKey');
  private textToVoiceQueue: string[] = [];
  private isTextToVoiceProcessing: boolean = false;
  private shouldStopPlayback: boolean = false;
  private voicePlaybackQueue: string[] = [];
  private isVoicePlaying: boolean = false;
  private soundPlayer: SoundPlay = new SoundPlay();
  private speechfile: string = './voice.wav';
  private readonly settingsListener: vscode.Disposable;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    super(context, settingsManager);

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('repo-code-assistant.openaiApiKey')) {
        this.apiKey = settingsManager.get('openaiApiKey');
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async sendRequest(Text: string): Promise<Uint8Array | string> {
    const openai = new OpenAI({
      apiKey: this.apiKey,
    });
    try {
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'nova',
        input: Text,
      });
      return Buffer.from(await mp3.arrayBuffer());
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
      const response = await this.sendRequest(textChunk);

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

  public async textToVoice(_text: string): Promise<void> {
    this.shouldStopPlayback = false;

    return new Promise<void>((resolve, reject) => {
      const textChunks = this.splitTextIntoChunks(
        this.removeCodeReferences(_text),
      ).map((chunk) => this.preprocessText(chunk));

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

  public async voiceToText(): Promise<string> {
    const openai = new OpenAI({
      apiKey: this.apiKey,
    });
    try {
      const transcription = await openai.audio.transcriptions.create({
          file:fs1.createReadStream(this.speechfile),
          model: "whisper-1",
      });
      return transcription.text;
    }catch(error){
      vscode.window.showErrorMessage(
          'Failed on Text to Speech. ' + error,
        );
      return 'Failed on Speech to Text.';
    }
  }


}
