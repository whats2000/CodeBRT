import vscode from 'vscode';

import type { MiscApi } from './types';
import { ToolServiceProvider } from '../../services/tools';
import { triggerEvent } from '../registerView';
import { FileOperationsProvider } from '../../utils';
import { TerminalManager } from '../../integrations';
import path from 'path';

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
    runCommand: async (command, relativePath) => {
      const workspaceFolders = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolders) {
        return;
      }

      if (!command || command.trim() === '') {
        return;
      }

      const commandWithRelativePath = !relativePath
        ? workspaceFolders.uri.fsPath
        : path.resolve(workspaceFolders.uri.fsPath, relativePath);

      try {
        const terminalInfo = await terminalManager.getOrCreateTerminal(
          commandWithRelativePath,
        );
        terminalInfo.terminal.show();

        const process = terminalManager.runCommand(terminalInfo, command);
        await process;
      } catch (error) {
        console.error(error);
      }
    },
    closeDiffView: async () => {
      vscode.commands.executeCommand('code-brt.closeDiff');
    },
  };
};
