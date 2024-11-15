import vscode from 'vscode';

import { CodeFixerApi, Modification } from './types';
import { OpenaiCodeFixerService } from '../../services/codeFixer';
import { DecorationController, DiffViewProvider } from '../../diff';

export const createCodeFixerApi = (
  openaiCodeFixerService: OpenaiCodeFixerService,
  diffViewProvider: DiffViewProvider,
  connectedViews: Partial<Record<string, vscode.WebviewView>>,
): CodeFixerApi => {
  return {
    getCurrentEditorCode: async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('Failed to find editor');
        return '';
      }
      return editor.document.getText();
    },
    insertCode: async (code: string) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('Failed to find editor');
        return;
      }

      await editor.edit((editBuilder) => {
        const position = editor.selection.active;
        editBuilder.insert(position, code);
      });
    },
    fixCode: async (options) => {
      return await openaiCodeFixerService.getResponse(options);
    },
    insertSelectedCodeToChat: async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('Failed to find editor');
        return;
      }

      const selectedText = editor.document.getText(editor.selection);
      if (!selectedText) {
        vscode.window.showErrorMessage('No code selected');
        return;
      }

      Object.values(connectedViews).forEach((view) => {
        view?.webview.postMessage({
          type: 'message',
          text: selectedText,
        });
      });

      vscode.window.showInformationMessage(
        `Selected code sent to chat: ${selectedText}`,
      );
    },
    applyDecorations: async (modifications: Modification[]) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('Editor not found');
        return;
      }

      const additionController = new DecorationController(
        'fadedOverlay',
        editor,
      );
      const deletionController = new DecorationController('activeLine', editor);

      // Clear any existing decorations
      additionController.clear();
      deletionController.clear();

      modifications.forEach((mod) => {
        if (mod.content !== '') {
          additionController.addLines(
            mod.startLine - 1,
            mod.endLine - mod.startLine + 1,
          );
        } else {
          deletionController.addLines(
            mod.startLine - 1,
            mod.endLine - mod.startLine + 1,
          );
        }
      });

      vscode.window.showInformationMessage('Decorations applied successfully.');
    },
    getEditorInfo: async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('Editor not found');
        return null;
      }

      const document = editor.document;
      const firstLine = document.lineAt(0);
      return {
        startingLine: firstLine.lineNumber + 1,
      };
    },
    showFullDiffInEditor: async ({ originalCode, modifiedCode }) => {
      await diffViewProvider.showDiffInEditor(originalCode, modifiedCode);
    },
    applyCodeChanges: async (
      modifications: Modification[],
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        if (!modifications || modifications.length === 0) {
          vscode.window.showErrorMessage(
            'No modifications provided for applying code changes.',
          );
          return {
            success: false,
            error: 'No modifications provided for applying code changes.',
          };
        }

        // Ensure `diffViewProvider` content is set to latest
        if (!diffViewProvider.getOriginalContent()) {
          // If the original content is not set, set it to the current editor content
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            const originalContent = editor.document.getText();
            diffViewProvider.setOriginalContent(originalContent);
            diffViewProvider.setOriginalDocumentUri(editor.document.uri);
          } else {
            vscode.window.showErrorMessage(
              'No active editor found to retrieve original content.',
            );
            return {
              success: false,
              error: 'No active editor found to retrieve original content.',
            };
          }
        }

        // Replace `Modification[]` with the updated content
        let updatedContent = diffViewProvider.getOriginalContent();
        modifications.forEach((mod) => {
          const lines = updatedContent.split('\n');
          if (mod.content === '') {
            // Delete content from the specified line
            lines.splice(mod.startLine - 1, mod.endLine - mod.startLine + 1);
          } else {
            // Insert content at the specified line
            lines.splice(mod.startLine - 1, 0, mod.content);
          }
          updatedContent = lines.join('\n');
        });

        await diffViewProvider.updateContent(updatedContent);
        return await diffViewProvider.applyChanges();
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    revertTemporaryInsertions: async () => {
      await diffViewProvider.revertChanges();
    },
    closeActiveEditor: async () => {
      await vscode.commands.executeCommand(
        'workbench.action.closeActiveEditor',
      );
    },
  };
};
