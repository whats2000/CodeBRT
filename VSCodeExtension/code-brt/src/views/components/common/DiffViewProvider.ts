import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { DecorationController } from './DecorationController';
import * as diff from 'diff';

export const DIFF_VIEW_URI_SCHEME = 'cline-diff';

export class DiffViewProvider {
  private originalContent: string = '';
  private modifiedContent: string = '';
  private activeEditor?: vscode.TextEditor;
  private fadedOverlayController?: DecorationController;
  private activeLineController?: DecorationController;
  private originalDocumentUri?: vscode.Uri;

  constructor(private cwd: string) {
    this.applyChanges = this.applyChanges.bind(this);
  }

  public getOriginalContent(): string {
    return this.originalContent;
  }

  public setOriginalContent(content: string): void {
    this.originalContent = content;
  }

  public getModifiedContent(): string {
    return this.modifiedContent;
  }

  public setModifiedContent(content: string): void {
    this.modifiedContent = content;
  }

  public getOriginalDocumentUri(): vscode.Uri | undefined {
    return this.originalDocumentUri;
  }

  public setOriginalDocumentUri(uri: vscode.Uri): void {
    this.originalDocumentUri = uri;
  }
  // 開啟原始檔案並取得內容
  async openFileForEdit(relPath: string) {
    try {
      const absolutePath = path.resolve(this.cwd, relPath);
      this.originalContent = await fs.readFile(absolutePath, 'utf-8');
      const document = await vscode.workspace.openTextDocument(absolutePath);
      this.activeEditor = await vscode.window.showTextDocument(document, {
        preview: false,
      });
      this.originalDocumentUri = document.uri; // 确保设置了原始文档的 URI
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to open file for edit: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // 更新顯示變更，動態掃描效果
  async updateContentWithAnimation(newContent: string) {
    if (
      !this.activeEditor ||
      !this.activeLineController ||
      !this.fadedOverlayController
    ) {
      throw new Error('Editor or decoration controllers not initialized.');
    }

    this.modifiedContent = newContent;
    const newLines = newContent.split('\n');
    const originalLines = this.originalContent.split('\n');
    const lineDiffs = diff.diffLines(this.originalContent, newContent);

    let currentLine = 0;
    for (const part of lineDiffs) {
      if (part.added) {
        for (let i = 0; i < part.count!; i++) {
          await this.replaceLine(currentLine, newLines[currentLine]);
          this.activeLineController.setActiveLine(currentLine);
          this.fadedOverlayController.updateOverlayAfterLine(
            currentLine,
            this.activeEditor.document.lineCount,
          );
          this.scrollEditorToLine(currentLine);
          currentLine++;
          await this.delay(300); // 動態掃描的延遲效果
        }
      } else if (part.removed) {
        currentLine += part.count!;
      } else {
        currentLine += part.count!;
      }
    }
  }

  // 替換指定行的內容
  private async replaceLine(line: number, content: string) {
    if (!this.activeEditor) {
      throw new Error('Editor not found');
    }
    const edit = new vscode.WorkspaceEdit();
    const lineRange = this.activeEditor.document.lineAt(line).range;
    edit.replace(this.activeEditor.document.uri, lineRange, content);
    await vscode.workspace.applyEdit(edit);
  }

  // 保存變更
  public async applyChanges(): Promise<{ success: boolean; error?: string }> {
    if (!this.modifiedContent) {
      vscode.window.showErrorMessage('No modified content to apply.');
      return { success: false, error: 'No modified content to apply.' };
    }

    try {
      // 確保原始編輯器處於活動狀態
      if (this.originalDocumentUri) {
        const document = await vscode.workspace.openTextDocument(
          this.originalDocumentUri,
        );
        this.activeEditor = await vscode.window.showTextDocument(document, {
          preview: false,
        });
      } else {
        throw new Error('Original document URI is not available.');
      }

      // 再次檢查活動編輯器是否與原始文檔匹配
      if (
        !this.activeEditor ||
        this.activeEditor.document.uri.toString() !==
          this.originalDocumentUri?.toString()
      ) {
        throw new Error('No matching active editor found to apply changes.');
      }

      // 获取整个文件的范围
      const fullRange = new vscode.Range(
        new vscode.Position(0, 0),
        this.activeEditor.document.lineAt(
          this.activeEditor.document.lineCount - 1,
        ).range.end,
      );

      // 开始编辑并替换整个文件的内容为修改后的内容
      await this.activeEditor.edit((editBuilder) => {
        editBuilder.replace(fullRange, this.modifiedContent);
      });

      // 自动保存修改后的文档
      await this.activeEditor.document.save();

      // 成功应用修改后，关闭差异视图
      await vscode.commands.executeCommand(
        'workbench.action.closeActiveEditor',
      );

      vscode.window.showInformationMessage(
        'Code changes applied successfully.',
      );
      return { success: true };
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to apply code changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async updateContent(newContent: string) {
    if (newContent && newContent.trim().length > 0) {
      this.modifiedContent = newContent;
    } else {
      vscode.window.showWarningMessage('No new content provided for update.');
    }
  }

  // 滾動到指定行
  private scrollEditorToLine(line: number) {
    if (this.activeEditor) {
      const scrollLine = line + 4;
      this.activeEditor.revealRange(
        new vscode.Range(scrollLine, 0, scrollLine, 0),
        vscode.TextEditorRevealType.InCenter,
      );
    }
  }

  // 延遲功能，用於製造動態效果
  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async showDiffInEditor(originalCode: string, modifiedCode: string) {
    if (!this.activeEditor) {
      // 嘗試重新取得活動編輯器
      this.activeEditor = vscode.window.activeTextEditor;

      if (!this.activeEditor) {
        throw new Error('No active editor found');
      }
    }

    this.originalContent = originalCode;
    this.modifiedContent = modifiedCode;

    const originalUri = this.activeEditor.document.uri;

    const modifiedDoc = await vscode.workspace.openTextDocument({
      content: modifiedCode,
      language: this.activeEditor.document.languageId, // 保持相同的語言模式
    });

    // 保存原始編輯器的引用
    this.originalDocumentUri = originalUri;

    await vscode.commands.executeCommand(
      'vscode.diff',
      originalUri,
      modifiedDoc.uri,
      'Original ↔ Modified',
      {
        preview: false,
      },
    );
  }
}
