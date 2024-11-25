import type { HistoryManagerApi } from './types';
import { HistoryManager } from '../historyManager';
import vscode from 'vscode';
import path from 'path';

export const createHistoryManagerApi = (
  historyManager: HistoryManager,
): HistoryManagerApi => {
  return {
    getCurrentHistory: () => {
      return historyManager.getCurrentHistory();
    },
    addNewConversationHistory: async () => {
      return await historyManager.addNewConversationHistory();
    },
    editLanguageModelConversationHistory: (entryID, newMessage) => {
      void historyManager.editConversationEntry(entryID, newMessage);
    },
    getHistoryIndexes: () => {
      return historyManager.getHistoryIndexes();
    },
    switchHistory: (historyID) => {
      return historyManager.switchHistory(historyID);
    },
    deleteHistory: async (historyID) => {
      return await historyManager.deleteHistory(historyID);
    },
    updateHistoryTitleById: (historyID, title) => {
      void historyManager.updateHistoryTitleById(historyID, title);
    },
    addHistoryTag: (historyID, tag) => {
      void historyManager.addTagToHistory(historyID, tag);
    },
    removeHistoryTag: (historyID, tag) => {
      void historyManager.removeTagFromHistory(historyID, tag);
    },
    updateHistoryModelAdvanceSettings: (historyID, advanceSettings) => {
      void historyManager.updateHistoryModelAdvanceSettings(
        historyID,
        advanceSettings,
      );
    },
    addConversationEntry: async (entry) => {
      return await historyManager.addConversationEntry(entry);
    },
    syncFileChangeContext: async (operation, forceSync) => {
      return await historyManager.syncFileChangeContext(operation, forceSync);
    },
    rollbackToolResponses: async (entry) => {
      if (entry.toolResponses?.[0]?.toolCallName === 'writeToFile') {
        // From the parent entry, revert the file version
        const history = historyManager.getCurrentHistory();
        if (!entry.parent) {
          return history;
        }
        const parentEntry = history.entries[entry.parent];
        if (!parentEntry) {
          return history;
        }
        const relativePath =
          parentEntry.toolCalls?.[0]?.parameters?.relativePath;
        if (!relativePath) {
          return history;
        }
        const workspaceFolders = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolders) {
          return history;
        }

        const filePath = path.resolve(
          workspaceFolders.uri.fsPath,
          relativePath,
        );
        vscode.commands.executeCommand(
          'code-brt.revertFileVersion',
          filePath,
          undefined,
          true,
        );
      }

      return await historyManager.rollbackToolResponses();
    },
  };
};
