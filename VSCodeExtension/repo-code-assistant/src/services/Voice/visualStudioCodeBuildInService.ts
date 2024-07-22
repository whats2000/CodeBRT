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

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      const vscodeDir = path.join(workspaceFolders[0].uri.fsPath, '.vscode');
      if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir);
      }

      this.tempFilePath = path.join(vscodeDir, 'tempVoiceInput.txt');
    } else {
      // Store at extension root if no workspace is open
      this.tempFilePath = path.join(
        context.extensionPath,
        'tempVoiceInput.txt',
      );
    }
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
    try {
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
            this.stopVoiceToText().then(() => {
              this.clearInterval();
              subscription.dispose();
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

      // Switch back to the previous editor if it exists
      if (this.previousEditor) {
        await vscode.window.showTextDocument(this.previousEditor.document, {
          preview: true,
          preserveFocus: false,
        });
        await vscode.commands.executeCommand(
          'workbench.action.closeActiveEditor',
        );
        fs.unlinkSync(this.tempFilePath);
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
