import fs from 'fs';
import fsPromises from 'node:fs/promises';

import vscode from 'vscode';
import Groq from 'groq-sdk';

import { SettingsManager } from '../../api';
import { AbstractVoiceService } from './abstractVoiceService';

export class GroqVoiceService extends AbstractVoiceService {
  private readonly settingsListener: vscode.Disposable;
  private apiKey: string = this.settingsManager.get('groqApiKey');

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    super(context, settingsManager);

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('repo-code-assistant.groqApiKey')) {
        this.apiKey = settingsManager.get('groqApiKey');
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  protected async sendVoiceToTextRequest(filePath: string): Promise<string> {
    const groq = new Groq({
      apiKey: this.apiKey,
    });

    try {
      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-large-v3',
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
