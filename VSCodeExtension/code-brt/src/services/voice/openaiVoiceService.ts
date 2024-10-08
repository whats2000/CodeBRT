import fs from 'fs';
import fsPromises from 'node:fs/promises';

import vscode from 'vscode';
import OpenAI from 'openai';

import { MODEL_SERVICE_CONSTANTS } from '../../constants';
import { SettingsManager } from '../../api';
import { AbstractVoiceService } from './base/abstractVoiceService';

export class OpenaiVoiceService extends AbstractVoiceService {
  private readonly settingsListener: vscode.Disposable;
  private apiKey: string = this.settingsManager.get('openaiApiKey');

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    super(context, settingsManager);

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('code-brt.openaiApiKey')) {
        this.apiKey = settingsManager.get('openaiApiKey');
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  protected async sendTextToVoiceRequest(
    Text: string,
  ): Promise<Uint8Array | undefined> {
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
      vscode.window
        .showErrorMessage(
          'Error during API call:' + (error as Error).message,
          'Get API Key',
        )
        .then((selection) => {
          if (selection === 'Get API Key') {
            vscode.env.openExternal(
              vscode.Uri.parse(MODEL_SERVICE_CONSTANTS.openai.apiLink),
            );
          }
        });
      return;
    }
  }

  protected async sendVoiceToTextRequest(filePath: string): Promise<string> {
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
      vscode.window
        .showErrorMessage('Failed on Speech to Text. ' + error, 'Get API Key')
        .then((selection) => {
          if (selection === 'Get API Key') {
            vscode.env.openExternal(
              vscode.Uri.parse(MODEL_SERVICE_CONSTANTS.openai.apiLink),
            );
          }
        });
      return '';
    }
  }
}
