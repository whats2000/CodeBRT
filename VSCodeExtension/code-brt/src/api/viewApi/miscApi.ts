import vscode from 'vscode';

import type { MiscApi } from './types';
import { ToolServiceProvider } from '../../services/tools';
import { triggerEvent } from '../registerView';
import { FileOperationsProvider } from '../../utils';
import { TerminalManager } from '../../integrations';

export const createMiscApi = (
  ctx: vscode.ExtensionContext,
  terminalManager: TerminalManager,
  connectedViews: Partial<Record<string, vscode.WebviewView>>,
): MiscApi => {
  return {
    alertMessage: async (msg, type, selections) => {
      const showFunction = {
        info: vscode.window.showInformationMessage,
        warning: vscode.window.showWarningMessage,
        error: vscode.window.showErrorMessage,
      }[type];

      const selectionOptions = selections?.map((selection) => selection.text);
      if (selectionOptions) {
        await showFunction(msg, ...selectionOptions).then((selection) => {
          if (!selection) {
            return;
          }
          const commandArgs = selections?.find(
            (s) => s.text === selection,
          )?.commandArgs;
          if (!commandArgs || commandArgs.length === 0) {
            return;
          }
          vscode.commands.executeCommand(
            commandArgs[0],
            ...commandArgs.slice(1),
          );
        });
      }
    },
    uploadFile: async (base64Data, originalFileName) => {
      return FileOperationsProvider.uploadFile(
        ctx,
        base64Data,
        originalFileName,
      );
    },
    deleteFile: async (absolutePath) => {
      return FileOperationsProvider.deleteFile(absolutePath);
    },
    getWebviewUri: async (absolutePath: string) => {
      return await FileOperationsProvider.getWebviewUri(
        ctx,
        connectedViews,
        absolutePath,
      );
    },
    openExternalLink: async (url) => {
      await vscode.env.openExternal(vscode.Uri.parse(url));
    },
    openKeyboardShortcuts: async (commandId) => {
      await vscode.commands.executeCommand(
        'workbench.action.openGlobalKeybindings',
        `@command:${commandId}`,
      );
    },
    openExtensionMarketplace: async (extensionId) => {
      await vscode.commands.executeCommand(
        'workbench.extensions.search',
        extensionId,
      );
    },
    approveToolCall: async (toolCall) => {
      return await ToolServiceProvider.executeToolCall(
        toolCall,
        terminalManager,
        (status) => {
          triggerEvent('updateStatus', status);
        },
      );
    },
  };
};
