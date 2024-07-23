import fs from 'fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';

import vscode from 'vscode';
import OpenAI from 'openai';

import { SettingsManager } from '../../api';
import { AbstractVoiceService } from './abstractVoiceService';
import { AudioRecorder } from '../../utils';

export class OpenaiVoiceService extends AbstractVoiceService {
  private readonly settingsListener: vscode.Disposable;
  private readonly audioRecorder = new AudioRecorder();
  private apiKey: string = this.settingsManager.get('openaiApiKey');

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

  protected async sendRequest(Text: string): Promise<Uint8Array | string> {
    const openai = new OpenAI({
      apiKey: this.apiKey,
    });
    try {
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: this.settingsManager.get('openaiSelectedVoice'),
        input: Text,
      });
      return Buffer.from(await mp3.arrayBuffer());
    } catch (error) {
      console.error('Error during API call:', (error as Error).message);
      return `Error during API call: ${(error as Error).message}`;
    }
  }

  public async voiceToText(): Promise<string> {
    const mediaDir = path.join(this.context.extensionPath, 'media');

    try {
      await fsPromises.mkdir(mediaDir, { recursive: true });
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to create media directory: ${error}`,
      );
    }

    vscode.window.showInformationMessage(`Recording started.`);

    let filePath: string;

    try {
      filePath = await this.audioRecorder.record(mediaDir);
    } catch (error) {
      vscode.window.showErrorMessage('Failed to record audio. ' + error);
      return '';
    }

    vscode.window.showInformationMessage(`Recording finished.`);

    const openai = new OpenAI({
      apiKey: this.apiKey,
    });
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-1',
      });
      await fsPromises.unlink(filePath);
      return transcription.text;
    } catch (error) {
      await fsPromises.unlink(filePath);
      vscode.window.showErrorMessage('Failed on Text to Speech. ' + error);
      return 'Failed on Speech to Text.';
    }
  }
}
