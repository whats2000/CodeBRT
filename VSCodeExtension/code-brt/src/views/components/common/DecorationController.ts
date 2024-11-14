import * as vscode from 'vscode';

// 新增的裝飾類型
const fadedOverlayDecorationType = vscode.window.createTextEditorDecorationType(
  {
    backgroundColor: 'rgba(144, 238, 144, 0.3)',
    isWholeLine: true,
  },
);

// 刪除的裝飾類型
const activeLineDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(255, 99, 71, 0.5)',
  isWholeLine: true,
  border: '1px solid rgba(255, 0, 0, 0.8)',
});

// 修改的裝飾類型
const modifiedLineDecorationType = vscode.window.createTextEditorDecorationType(
  {
    backgroundColor: 'rgba(70, 130, 180, 0.3)', // 藍色背景表示修改部分
    isWholeLine: true,
  },
);

type DecorationType = 'fadedOverlay' | 'activeLine' | 'modifiedLine';

export class DecorationController {
  private decorationType: vscode.TextEditorDecorationType;
  private editor: vscode.TextEditor;
  private ranges: vscode.Range[] = [];

  constructor(decorationType: DecorationType, editor: vscode.TextEditor) {
    this.editor = editor;
    switch (decorationType) {
      case 'fadedOverlay':
        this.decorationType = fadedOverlayDecorationType;
        break;
      case 'activeLine':
        this.decorationType = activeLineDecorationType;
        break;
      case 'modifiedLine':
        this.decorationType = modifiedLineDecorationType;
        break;
      default:
        throw new Error(`Unknown decoration type: ${decorationType}`);
    }
  }

  // 新增行裝飾的方法
  addLines(startLine: number, numLines: number) {
    if (startLine < 0 || numLines <= 0) {
      return;
    }

    const endLine = startLine + numLines - 1;
    this.ranges.push(
      new vscode.Range(startLine, 0, endLine, Number.MAX_SAFE_INTEGER),
    );

    this.editor.setDecorations(this.decorationType, this.ranges);
  }

  // 更新特定行之後的 Overlay 裝飾（例如動態更新輸出）
  updateOverlayAfterLine(currentLine: number, totalLines: number) {
    const newRanges = this.ranges.filter(
      (range) => range.start.line <= currentLine,
    );
    if (currentLine < totalLines) {
      newRanges.push(
        new vscode.Range(
          currentLine + 1,
          0,
          totalLines,
          Number.MAX_SAFE_INTEGER,
        ),
      );
    }

    this.ranges = newRanges;
    this.editor.setDecorations(this.decorationType, this.ranges);
  }

  // 設定當前活躍行（例如用於刪除的行）
  setActiveLine(lineNumber: number) {
    this.ranges = [
      new vscode.Range(lineNumber, 0, lineNumber, Number.MAX_SAFE_INTEGER),
    ];
    this.editor.setDecorations(this.decorationType, this.ranges);
  }

  // 清除所有裝飾的方法
  clear() {
    this.ranges = [];
    this.editor.setDecorations(this.decorationType, this.ranges);
  }

  // 移除特定行裝飾的方法
  removeLineDecoration(lineNumber: number) {
    this.ranges = this.ranges.filter(
      (range) => range.start.line !== lineNumber,
    );
    this.editor.setDecorations(this.decorationType, this.ranges);
  }
}
