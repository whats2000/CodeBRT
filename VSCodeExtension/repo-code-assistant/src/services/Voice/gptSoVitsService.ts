import axios, { AxiosResponse } from 'axios';
import vscode from 'vscode';

import SettingsManager from '../../api/settingsManager';
import { AbstractVoiceService } from './abstractVoiceService';
import path from 'node:path';
import fs from 'node:fs/promises';

export class GptSoVitsApiService extends AbstractVoiceService {
  private clientHost: string;
  private referWavPath: string = '';
  private referText: string = '';
  private promptLanguage: string = '';
  private readonly ctx: vscode.ExtensionContext;
  private readonly settingsListener: vscode.Disposable;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    super(settingsManager);

    this.updateSettings();

    this.clientHost = settingsManager.get('gptSoVitsClientHost');
    this.ctx = context;

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

  private async saveVoice(voice: Uint8Array): Promise<string> {
    const mediaDir = path.join(this.ctx.extensionPath, 'media');

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

  private preprocessText(text: string): string {
    // 移除Markdown標題
    text = text.replace(/#+/g, '');
    // 移除Markdown列表項目
    text = text.replace(/[*+-]/g, '');
    // 移除Markdown鏈接
    text = text.replace(/\[.*?]\(.*?\)/g, '');
    // 移除Markdown粗體、斜體和刪除線
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2'); // 粗體
    text = text.replace(/([*_])(.*?)\1/g, '$2'); // 斜體
    text = text.replace(/~~(.*?)~~/g, '$1'); // 刪除線
    // 移除Markdown大引號
    text = text.replace(/`{1,3}([^`]*)`{1,3}/g, '$1');
    // 移除Markdown圖片
    text = text.replace(/!\[.*?]\(.*?\)/g, '');
    // 移除Markdown引用
    text = text.replace(/^>+\s?/gm, '');
    // 移除多餘的空格和換行符
    text = text.replace(/\n/g, ' ').trim();
    return text;
  }

  public async textToVoice(text: string): Promise<string> {
    vscode.window.showInformationMessage(this.preprocessText(text));

    const response = await this.sendRequest(this.preprocessText(text));

    if (typeof response === 'string') {
      return response;
    }

    return await this.saveVoice(response);
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
