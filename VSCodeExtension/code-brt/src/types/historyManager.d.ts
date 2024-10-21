import {
  ConversationEntry,
  ConversationEntryRole,
  ConversationHistory,
  ConversationHistoryIndexList,
  ConversationModelAdvanceSettings,
  ModelServiceType,
} from '../types';

export type IHistoryManager = {
  /**
   * Get the current loaded history
   * @returns The current-loaded history
   */
  getCurrentHistory(): ConversationHistory;

  /**
   * Get the history before the current entry by the current entry ID
   * @param currentEntryID The current entry ID
   * @returns The history before the current entry
   */
  getHistoryBeforeEntry(currentEntryID?: string): ConversationHistory;

  /**
   * Add a new conversation history
   * @returns The new conversation history
   */
  addNewConversationHistory(): Promise<ConversationHistory>;

  /**
   * Add a new conversation entry
   * @param parentID The parent ID of the entry
   * @param role The role of the entry
   * @param message The message of the entry
   * @param images The images of the entry
   * @param modelServiceType The model service type of the entry
   * @param modelName The model name of the entry
   * @returns The new entry ID
   */
  addConversationEntry(
    parentID: string | null,
    role: ConversationEntryRole,
    message: string,
    images?: string[],
    modelServiceType?: ModelServiceType,
    modelName?: string,
  ): Promise<ConversationEntry>;

  /**
   * Edit a conversation entry
   * @param entryID The entry ID to edit
   * @param newMessage The new message
   */
  editConversationEntry(entryID: string, newMessage: string): Promise<void>;

  /**
   * Update the title of a history by ID
   * @param historyID The history ID
   * @param newTitle The new title
   */
  updateHistoryTitleById(historyID: string, newTitle: string): Promise<void>;

  /**
   * Switch the current history by ID
   * @param historyID The history ID
   */
  switchHistory(historyID: string): Promise<ConversationHistory>;

  /**
   * Get the histories index
   * @returns The history index
   */
  getHistoryIndexes(): ConversationHistoryIndexList;

  /**
   * Delete a history by ID
   * @param historyID The history ID
   * @returns The new conversation history
   */
  deleteHistory(historyID: string): Promise<ConversationHistory>;

  /**
   * Add a tag to a history
   * @param historyID The history ID
   * @param tag The tag to add
   */
  addTagToHistory(historyID: string, tag: string): Promise<void>;

  /**
   * Remove a tag from a history
   * @param historyID The history ID
   * @param tag The tag to remove
   */
  removeTagFromHistory(historyID: string, tag: string): Promise<void>;

  /**
   * Update the current history's model advance settings
   */
  updateHistoryModelAdvanceSettings(
    historyID: string,
    advanceSettings: ConversationModelAdvanceSettings,
  ): Promise<void>;
};
