import * as vscode from 'vscode';

/**
 * 顯示 side-by-side 差異檢視的函數
 * @param modifications - 用於顯示的修改資料
 */
export function showDiffInEditor(modifications: any) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('無法找到活動編輯器。');
    return;
  }

  const originalUri = vscode.Uri.file(editor.document.fileName);
  const generatedUri = vscode.Uri.file('generatedCode.js'); // 假設為生成的程式碼文件

  const options: vscode.TextDocumentShowOptions = {
    viewColumn: vscode.ViewColumn.Beside,
    preserveFocus: true,
    preview: false,
  };

  return vscode.commands.executeCommand(
    'vscode.diff',
    originalUri,
    generatedUri,
    '原始碼 ↔ 修改後的程式碼',
    options,
  );
}
