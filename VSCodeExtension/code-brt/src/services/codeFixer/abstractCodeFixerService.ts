import {
  CodeFixerService,
  GetResponseCodeFixerOptions,
  CodeFixerResponse,
  CodeFixerStatuses,
  CodeFixerModelServiceType,
} from '../../types';
import vscode from 'vscode';
import { SettingsManager } from '../../api';

export abstract class AbstractCodeFixerService
  implements CodeFixerService {
  private statuses: CodeFixerStatuses = {};

  // 將 formatInstructions 變成變數
  protected formatInstructions: string =
    `Output the modifications in the following JSON format:
      [
        {
          "startLine": number,
          "endLine": number,
          "content": string
        },
        ...
      ]`;

  // 將 prompt 變成變數
  protected prompt: string = `
      You are a coding assistant. Given the following inputs:
      - query: {userQuery}
      - originalCode: {originalCode}
      - generatedCode: {generatedCode}
      
      Your task is to compare the original code with the generated code 
      and identify where replacements, insertions, or deletions should be made 
      in the original code. Provide the exact start line and end line positions 
      for each changed paragraph, along with the content that should be inserted 
      or left blank if content is deleted.
      
      Represent changes using the following rules:
      - For insertions: Indicate between which two lines the code should be inserted by specifying the lines and providing the inserted code as \`content\`.
      - For deletions: Indicate the start and end line numbers of the code to be deleted, with \`content\` set as an empty string ("").
      - For replacements: Use a combination of insert and delete entries to describe the replacement.
      
      Example 1:
      - Original Code:
        1: const x = 5;
        2: const y = 10;
        3: const result = x + y;
      - Generated Code:
        1: const a = 5;
        2: const b = 10;
        3: const result = a + b;
      - Output:
        [
          {{ "startLine": 1, "endLine": 3, "content": "" }},
          {{ "startLine": 1, "endLine": 3, "content": "const a = 5;\\\\n" +
            "const b = 10;\\\\n" +
            "const result = a + b;"
           }},
        ]

      Example 2:
      - Original Code:
        1: function add(x, y) {{
        2:   return x + y;
        3: }}
      - Generated Code:
        1: function add(a, b) {{
        2:   return a + b;
        3: }}
      - Output:
        [
          {{ "startLine": 1, "endLine": 3, "content": "" }},
          {{ "startLine": 1, "endLine": 3, "content": "function add(a, b) {{\\\\n" +
            "  return a + b;\\\\n"+
            "}}"
          }}
        ]

      The output format should be a JSON array of objects, where each object includes:
      - \`startLine\`: The line number where the insertion or deletion starts.
      - \`endLine\`: The line number where the insertion or deletion ends.
      - \`content\`: The code content to be inserted or an empty string if the code is deleted.
      
      {format_instructions}
    `;

  protected constructor(
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
    vscode.window
      .showErrorMessage(
        'Current this model service does not support updating available models, Please update it manually.',
      )
      .then();

    return this.availableModelNames;
  }

  public switchModel(newModel: string): void {
    const lastSelectedModel = this.settingsManager.get('codeFixerLastSelectedModel');
    if (this.availableModelNames.length === 0) {
      this.currentModel = '';
      lastSelectedModel[this.serviceType] = '';
      this.settingsManager
        .set('codeFixerLastSelectedModel', lastSelectedModel)
        .then(() => {
          vscode.window
            .showErrorMessage(
              'No available models to switch to. Please configure the models first.',
            )
            .then();
        });
      return;
    }

    if (this.availableModelNames.includes(newModel)) {
      this.currentModel = newModel;
      lastSelectedModel[this.serviceType] = newModel;
      this.settingsManager
        .set('codeFixerLastSelectedModel', lastSelectedModel)
        .then(() => {
          vscode.window
            .showInformationMessage(`Switched to model: ${newModel}`)
            .then();
        });
    } else {
      vscode.window
        .showErrorMessage(`Model ${newModel} is not available.`)
        .then();
    }
  }

  public async stopResponse(): Promise<void> {
    vscode.window
      .showInformationMessage(
        'This feature is not supported by the current model.',
      )
      .then();
  }

  updateStatus(key: string, status: 'waitForResponse' | 'receivedResponse' | 'error'): void {
    this.statuses[key] = { status };
  }

  public abstract getResponse(options: GetResponseCodeFixerOptions): Promise<CodeFixerResponse>;

}
