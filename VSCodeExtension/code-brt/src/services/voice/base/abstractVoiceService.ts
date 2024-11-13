import path from 'node:path';
import fs from 'node:fs/promises';
import { Promise } from 'promise-deferred';

import * as vscode from 'vscode';
import * as tokenizer from 'simple-text-tokenizer';
import removeMarkdown from 'markdown-to-text';

import type { VoiceService } from '../types';
import { SettingsManager } from '../../../api';
import { SoundPlay, AudioRecorder } from '../utils';

export abstract class AbstractVoiceService implements VoiceService {
  protected readonly context: vscode.ExtensionContext;
  protected readonly settingsManager: SettingsManager;

  protected isTextToVoiceProcessing: boolean = false;
  protected shouldStopPlayback: boolean = false;
  protected isVoicePlaying: boolean = false;
  protected textToVoiceQueue: string[] = [];
  protected voicePlaybackQueue: string[] = [];
  protected soundPlayer: SoundPlay = new SoundPlay();
  protected audioRecorder: AudioRecorder = new AudioRecorder();

  protected constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    this.context = context;
    this.settingsManager = settingsManager;
  }

  /**
   * Removes code references from the given text.
   * @param text - The text to remove code references from.
   */
  private removeCodeReferences(text: string): string {
    return text.replace(/```[\s\S]*?```/g, '');
  }

  /**
   * Preprocesses the given text to remove unnecessary characters.
   * @param text - The text to preprocess.
   */
  private preprocessText(text: string): string {
    text = text.replace(
      /^([*-+]\s.*?)([:.!?：。！？]?)$/gm,
      (match, p1, p2) => {
        return p2 ? match : p1 + '.';
      },
    );
    return removeMarkdown(text);
  }

  /**
   * Saves the given voice data to a file.
   * @param voice - The voice data to save.
   * @returns The path to the saved voice file.
   */
  private async saveVoice(voice: Uint8Array): Promise<string> {
    const mediaDir = path.join(this.context.extensionPath, 'media');

    // Create the media directory if it does not exist
    try {
      await fs.mkdir(mediaDir, { recursive: true });
    } catch (error) {
      throw new Error('Failed to create media directory: ' + error);
    }

    // Generate a unique filename to avoid conflicts
    const filename = path.join(mediaDir, `converted_voice_${Date.now()}.wav`);

    try {
      await fs.writeFile(filename, voice);
    } catch (error) {
      throw new Error('Failed to write image file: ' + error);
    }

    return filename;
  }

  /**
   * Splits the given text into chunks of the specified size.
   * @param text - The text to split.
   * @param chunkSize - The size of each chunk.
   * @returns An array of text chunks.
   */
  private splitTextIntoChunks(text: string, chunkSize: number = 2): string[] {
    const sentences = tokenizer.getSentenceTokens(text);
    const chunks = [];
    for (let i = 0; i < sentences.length; i += chunkSize) {
      chunks.push(sentences.slice(i, i + chunkSize).join(' '));
    }
    return chunks;
  }

  /**
   * Processes the text to voice queue.
   */
  private async processTextToVoiceQueue(): Promise<void> {
    if (this.isTextToVoiceProcessing || this.textToVoiceQueue.length === 0) {
      return;
    }

    this.isTextToVoiceProcessing = true;

    while (this.textToVoiceQueue.length > 0) {
      const textChunk = this.textToVoiceQueue.shift()!;
      const response = await this.sendTextToVoiceRequest(textChunk);

      if (!response) {
        this.isTextToVoiceProcessing = false;
        return;
      }

      if (this.shouldStopPlayback) {
        this.isTextToVoiceProcessing = false;
        return;
      }

      const voicePath = await this.saveVoice(response as Uint8Array);

      this.voicePlaybackQueue.push(voicePath);
      void this.processVoicePlaybackQueue();
    }

    this.isTextToVoiceProcessing = false;
  }

  /**
   * Processes the voice playback queue.
   */
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

  /**
   * Sends a request to the voice service to convert the given text to voice.
   * @param _text - The text to convert to voice.
   * @protected
   */
  protected sendTextToVoiceRequest(
    _text: string,
  ): Promise<Uint8Array | undefined> {
    void vscode.window.showErrorMessage(
      'The sendRequest method is not implemented, how did you get here?',
    );

    return Promise.resolve(undefined);
  }

  /**
   * Sends a request to the voice service to convert the given voice to text.
   * @param _filePath - The path to the voice file to convert to text.
   * @protected
   */
  protected sendVoiceToTextRequest(_filePath: string): Promise<string> {
    void vscode.window.showErrorMessage(
      'The sendRequest method is not implemented, how did you get here?',
    );

    return Promise.resolve('');
  }

  /**
   * Converts the given text to voice.
   * @param text - The text to convert to voice.
   */
  public async textToVoice(text: string): Promise<void> {
    this.shouldStopPlayback = false;

    return new Promise<void>((resolve, reject) => {
      const removeCodeReferencesText = this.removeCodeReferences(text);
      const preprocessedText = this.preprocessText(removeCodeReferencesText);
      const textChunks = this.splitTextIntoChunks(preprocessedText);

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

  /**
   * Records voice and converts it to text.
   */
  public async voiceToText(): Promise<string> {
    const mediaDir = path.join(this.context.extensionPath, 'media');

    try {
      await fs.mkdir(mediaDir, { recursive: true });
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to create media directory: ${error}`,
      );
    }

    let filePath: string;

    try {
      filePath = await this.audioRecorder.record(mediaDir);
    } catch (error) {
      vscode.window
        .showErrorMessage(
          'Failed to record audio. Currently record audio with the microphone need SoX (Window/Mac) and ALSA (Linux). ' +
            'Click here to install SoX or copy command below to install ALSA. ' +
            'IMPORTANT: You need to add SoX to your PATH after installation for Windows.',
          'Install SoX',
          'Copy command (Linux)',
        )
        .then(async (value) => {
          if (value === 'Install SoX') {
            await vscode.env.openExternal(
              vscode.Uri.parse('https://sourceforge.net/projects/sox/'),
            );
          } else if (value === 'Copy command (Linux)') {
            vscode.env.clipboard.writeText('sudo apt-get install alsa-utils');
          }
        });
      return '';
    }

    return this.sendVoiceToTextRequest(filePath);
  }

  /**
   * Stops the voice playback and clears the queues.
   */
  public async stopTextToVoice(): Promise<void> {
    this.shouldStopPlayback = true;
    this.textToVoiceQueue = [];
    this.soundPlayer.stop();
  }

  /**
   * Stops the voice recording and clears the queues.
   */
  public async stopVoiceToText(): Promise<void> {
    void this.audioRecorder.stop();
  }
}
