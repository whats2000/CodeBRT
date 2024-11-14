import {
  CodeFixerService,
  GetResponseCodeFixerOptions,
  CodeFixerResponse,
  CodeFixerModelServiceType,
} from '../../../types';
import vscode from 'vscode';
import { SettingsManager } from '../../../api';
import {
  FORMAT_INSTRUCTIONS,
  SYSTEM_PROMPT,
} from '../constants';
/**
 * Misson:
 * 1. geminiCodeFixerService: updateStatus
 * 2. finish geminiCodeFixerService and abstractCodeFixerService function
 * 3. test and modify the available model in settingManager+extensionSettings.d.ts
 * 4. more LLM Service
 */
export abstract class AbstractCodeFixerService
  implements CodeFixerService {

  // 將 formatInstructions 變成變數
  protected formatInstructions: string = FORMAT_INSTRUCTIONS;


  // 將 prompt 變成變數
  protected prompt: string = SYSTEM_PROMPT;

  constructor(
    protected readonly serviceType: CodeFixerModelServiceType,
    protected readonly context: vscode.ExtensionContext,
    protected readonly settingsManager: SettingsManager,
    protected currentModel: string,
    protected availableModelNames: string[],
  ) {}

  public updateAvailableModels(newAvailableModels: string[]): void {
    this.availableModelNames = newAvailableModels;
  }

  public async getLatestAvailableModelNames(): Promise<string[]> {
    void vscode.window
      .showErrorMessage(
        'Current this model service does not support updating available models, Please update it manually.',
      )

    return this.availableModelNames;
  }

  public switchModel(newModel: string): void {
    const lastSelectedModel = this.settingsManager.get('lastSelectedModel');
    if (this.availableModelNames.length === 0) {
      this.currentModel = '';
      lastSelectedModel[this.serviceType] = '';
      this.settingsManager
        .set('lastSelectedModel', lastSelectedModel)
        .then(() => {
          void vscode.window.showErrorMessage(
            'No available models to switch to. Please configure the models first.',
          );
        });
      return;
    }

    if (this.availableModelNames.includes(newModel)) {
      this.currentModel = newModel;
      lastSelectedModel[this.serviceType] = newModel;
      this.settingsManager
        .set('lastSelectedModel', lastSelectedModel)
        .then(() => {
          void vscode.window.showInformationMessage(
            `Switched to model: ${newModel}`,
          );
        });
    } else {
      void vscode.window.showErrorMessage(
        `Model ${newModel} is not available.`,
      );
    }
  }

  /**
   * Stop current response
   */
  public async stopResponse(): Promise<void> {
    void vscode.window.showInformationMessage(
      'This feature is not supported by the current model.',
    );
  }

  public abstract getResponse(options: GetResponseCodeFixerOptions): Promise<CodeFixerResponse>;

}
