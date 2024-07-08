import { Promise } from 'promise-deferred';
import * as vscode from 'vscode';

import { VoiceService } from '../../types';
import SettingsManager from '../../api/settingsManager';
import path from 'node:path';
import fs from 'node:fs/promises';

export abstract class AbstractVoiceService implements VoiceService {
  protected readonly context: vscode.ExtensionContext;
  protected readonly settingsManager: SettingsManager;

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
  protected removeCodeReferences(text: string): string {
    return text.replace(/```[\s\S]*?```/g, '');
  }

  /**
   * Preprocesses the given text to remove unnecessary characters.
   * @param text - The text to preprocess.
   */
  protected preprocessText(text: string): string {
    text = text.replace(/#+/g, '');
    text = text.replace(/[*+-]/g, '');
    text = text.replace(/\[.*?]\(.*?\)/g, '');
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
    text = text.replace(/([*_])(.*?)\1/g, '$2');
    text = text.replace(/~~(.*?)~~/g, '$1');
    text = text.replace(/`{1,3}([^`]*)`{1,3}/g, '$1');
    text = text.replace(/!\[.*?]\(.*?\)/g, '');
    text = text.replace(/^>+\s?/gm, '');
    text = text.replace(/\n/g, ' ').trim();
    return text;
  }

  /**
   * Saves the given voice data to a file.
   * @param voice - The voice data to save.
   * @returns The path to the saved voice file.
   */
  protected async saveVoice(voice: Uint8Array): Promise<string> {
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
   * @param sentenceEndings - A regular expression to match sentence endings.
   * @returns An array of text chunks.
   */
  protected splitTextIntoChunks(
    text: string,
    chunkSize: number = 4,
    sentenceEndings: RegExp = /(?<=[.!?。！？])/,
  ): string[] {
    const sentences = text
      .split(sentenceEndings)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);
    const chunks = [];
    for (let i = 0; i < sentences.length; i += chunkSize) {
      chunks.push(sentences.slice(i, i + chunkSize).join(' '));
    }
    return chunks;
  }

  public async textToVoice(_text: string): Promise<void> {
    vscode.window
      .showInformationMessage('Text to voice is not supported in this service')
      .then();
  }

  public async voiceToText(_voicePath: string): Promise<string> {
    vscode.window
      .showInformationMessage('Voice to text is not supported in this service')
      .then();

    return Promise.resolve('');
  }

  public async stopVoice(): Promise<void> {
    vscode.window
      .showInformationMessage('Stop voice is not supported in this service')
      .then();
  }
}
