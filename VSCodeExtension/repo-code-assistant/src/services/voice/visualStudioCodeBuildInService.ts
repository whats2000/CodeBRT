import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { SettingsManager } from '../../api';
import { AbstractVoiceService } from './abstractVoiceService';

export class VisualStudioCodeBuiltInService extends AbstractVoiceService {
  private interval: NodeJS.Timeout | null = null;
  private readonly inactivityLimit: number;
  private readonly tempFilePath: string;
  private previousEditor: vscode.TextEditor | undefined;
  private latestText: string = '';
  private closingTime: number = 0;
  private resolveTextPromise: ((value: string) => void) | null = null;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    inactivityLimit = 2000,
  ) {
    super(context, settingsManager);
    this.inactivityLimit = inactivityLimit;
    this.tempFilePath = path.join(context.extensionPath, 'VoiceInput.txt');
  }

  private setClosingTime(ms: number): void {
    this.closingTime = Date.now() + ms;
  }

  private checkInactivity(): void {
    if (Date.now() > this.closingTime) {
      this.stopVoiceToText().then();
    }
  }

  private clearInterval(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  public async voiceToText(): Promise<string> {
    if (this.interval) return '';

    try {
      if (!vscode.extensions.getExtension('ms-vscode.vscode-speech')) {
        vscode.window
          .showInformationMessage(
            'Please install the "VS Code Speech" extension to use voice dictation.',
            'Install',
          )
          .then(async (value) => {
            if (value === 'Install') {
              await vscode.commands.executeCommand(
                'workbench.extensions.search',
                'ms-vscode.vscode-speech',
              );
            }
          });
        return '';
      }

      fs.writeFileSync(this.tempFilePath, '');

      // Save the current active editor
      this.previousEditor = vscode.window.activeTextEditor;

      const document = await vscode.workspace.openTextDocument(
        this.tempFilePath,
      );
      await vscode.window.showTextDocument(document, { preview: false });

      await vscode.commands.executeCommand(
        'workbench.action.editorDictation.start',
      );
      vscode.window.showInformationMessage('Voice dictation started.');

      this.setClosingTime(10000);

      return new Promise((resolve) => {
        this.resolveTextPromise = resolve;

        const subscription = vscode.workspace.onDidChangeTextDocument(
          (event) => {
            if (event.document.uri.fsPath === this.tempFilePath) {
              this.latestText = event.document.getText();

              if (this.latestText.trim().length > 0) {
                this.setClosingTime(this.inactivityLimit);
              }
            }
          },
        );

        this.interval = setInterval(() => {
          this.checkInactivity();
          if (Date.now() > this.closingTime) {
            subscription.dispose();
            this.stopVoiceToText().then(() => {
              resolve(this.latestText);
            });
          }
        }, 500);
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to start voice dictation: ' + error,
      );
      throw error;
    }
  }

  public async stopVoiceToText(): Promise<void> {
    try {
      await vscode.commands.executeCommand(
        'workbench.action.editorDictation.stop',
      );
      vscode.window.showInformationMessage('Voice dictation stopped.');
      this.clearInterval();

      if (
        vscode.window.activeTextEditor?.document.uri.fsPath ===
        this.tempFilePath
      ) {
        await vscode.commands
          .executeCommand('workbench.action.files.save')
          .then(() => {
            if (
              vscode.window.activeTextEditor?.document.uri.fsPath !==
              this.tempFilePath
            )
              return;
            vscode.commands.executeCommand(
              'workbench.action.closeActiveEditor',
            );
          });
      }

      // Switch back to the previous editor if it exists
      if (this.previousEditor) {
        await vscode.window.showTextDocument(this.previousEditor.document, {
          preview: false,
        });
      }

      // Resolve the promise with the latest text
      if (this.resolveTextPromise) {
        this.resolveTextPromise(this.latestText);
        this.resolveTextPromise = null;
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to stop voice dictation: ' + error,
      );
    }
  }
}
