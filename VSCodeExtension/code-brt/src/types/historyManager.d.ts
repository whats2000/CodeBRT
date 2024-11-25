import {
  ConversationEntry,
  ConversationEntryRole,
  ConversationHistory,
  ConversationHistoryIndexList,
  ConversationModelAdvanceSettings,
  ModelServiceType,
  ToolCallEntry,
  ToolCallResponse,
} from '../types';

/**
 * The parameters to add a conversation entry
 * @property parentID - The parent ID of the entry
 * @property role - The role of the entry
 * @property message - The message of the entry
 * @property images - The images of the entry
 * @property toolCalls - The tool calls of the entry
 * @property toolResponses - The tool responses of the entry
 * @property modelServiceType - The model service type of the entry
 * @property modelName - The model name of the entry
 */
export type AddConversationEntryParams = {
  parentID: string | null;
  role: ConversationEntryRole;
  message: string;
  images?: string[];
  toolCalls?: ToolCallEntry[];
  toolResponses?: ToolCallResponse[];
  modelServiceType?: ModelServiceType;
  modelName?: string;
};

type FileSyncOperation = {
  relativePath: string;
  newPath?: string; // For renaming operations
  newContent?: string; // For manual content changes
  deleted?: boolean; // If the file was deleted
};

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
   * @param entry The entry to add
   * @returns The new entry ID
   */
  addConversationEntry(
    entry: AddConversationEntryParams,
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

  /**
   * Sync the file changes
   * @param operations The file sync operations
   * @param forceSync If the sync should be forced
   */
  syncFileChangeContext(
    operations: FileSyncOperation[] = [],
    forceSync: boolean = false,
  ): Promise<ConversationHistory>;

  /**
   * Rollback the tool responses
   */
  rollbackToolResponses(): Promise<ConversationHistory>;
};
