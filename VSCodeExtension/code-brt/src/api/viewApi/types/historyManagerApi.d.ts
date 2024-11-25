import {
  AddConversationEntryParams,
  ConversationEntry,
  ConversationHistory,
  ConversationHistoryIndexList,
  ConversationModelAdvanceSettings,
  FileSyncOperation,
} from '../../../types';

export type HistoryManagerApi = {
  /**
   * Get the conversation history.
   * @returns The conversation history.
   */
  getCurrentHistory: () => ConversationHistory;

  /**
   * Add a new conversation history.
   * @returns The new conversation history.
   */
  addNewConversationHistory: () => Promise<ConversationHistory>;

  /**
   * Edit the conversation history.
   * @param entryID - The ID of the entry to edit.
   * @param newMessage - The new message to set.
   */
  editLanguageModelConversationHistory: (
    entryID: string,
    newMessage: string,
  ) => void;

  /**
   * Get the conversation history list.
   */
  getHistoryIndexes: () => ConversationHistoryIndexList;

  /**
   * Switch the conversation history.
   * @param historyID - The ID of the history to switch to.
   * @returns The new conversation history.
   */
  switchHistory: (historyID: string) => Promise<ConversationHistory>;

  /**
   * Delete a conversation history.
   * @param historyID - The ID of the history to delete.
   * @returns The new conversation history.
   */
  deleteHistory: (historyID: string) => Promise<ConversationHistory>;

  /**
   * Edit the specified history title.
   * @param historyID - The ID of the history to edit.
   * @param title - The new title.
   */
  updateHistoryTitleById: (historyID: string, title: string) => void;

  /**
   * Add a tag to a history.
   * @param historyID - The ID of the history to add the tag to.
   * @param tag - The tag to add.
   */
  addHistoryTag: (historyID: string, tag: string) => void;

  /**
   * Remove a tag from a history.
   * @param historyID - The ID of the history to remove the tag from.
   * @param tag - The tag to remove.
   */
  removeHistoryTag: (historyID: string, tag: string) => void;

  /**
   * Update the current history's model advance settings.
   * @param historyID - The ID of the history to update the advance settings for.
   * @param advanceSettings - The new advance settings.
   */
  updateHistoryModelAdvanceSettings: (
    historyID: string,
    advanceSettings: ConversationModelAdvanceSettings,
  ) => void;

  /**
   * Add a conversation entry to the conversation history for a language model.
   * @param parentID - The ID of the parent entry.
   * @param sender - The sender of the message.
   * @param message - The message to add.
   * @param images - The images to add.
   * @param modelServiceType - The type of the model service to add the entry to.
   * @param modelName - The name of the model to add the entry to.
   * @param toolCalls - The tool calls to add.
   * @param toolResponses - The tool responses to add.
   * @returns The ID of the new entry.
   */
  addConversationEntry: (
    entry: AddConversationEntryParams,
  ) => Promise<ConversationEntry>;

  /**
   * Sync the file change context.
   * @param operations - The file sync operations to perform.
   * @param forceSync - Whether to force the sync.
   */
  syncFileChangeContext: (
    operations: FileSyncOperation[] = [],
    forceSync: boolean = false,
  ) => Promise<ConversationHistory>;

  /**
   * Rollback the tool changes.
   */
  rollbackToolResponses: () => Promise<ConversationHistory>;
};
