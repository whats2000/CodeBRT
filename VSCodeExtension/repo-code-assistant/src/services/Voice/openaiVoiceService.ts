import { AbstractVoiceService } from './abstractVoiceService';
import vscode from 'vscode';

import SettingsManager from '../../api/settingsManager';

export class OpenaiVoiceService extends AbstractVoiceService {
  private apiKey: string;
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

  public async textToVoice(_text: string): Promise<void> {
    return super.textToVoice(_text);
  }

  public async voiceToText(): Promise<string> {
    return super.voiceToText();
  }
}
