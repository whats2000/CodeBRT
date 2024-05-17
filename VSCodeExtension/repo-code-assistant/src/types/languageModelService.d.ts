import { ConversationHistory, ConversationHistoryList } from "./conversationHistory";

export interface LanguageModelService {
  /**
   * Load the conversation histories from the file
   */
  loadHistories: () => Promise<void>;

  /**
   * Save the conversation histories to the file
   */
  saveHistories: () => Promise<void>;

  /**
   * Get the current conversation history
   */
  getConversationHistory: () => ConversationHistory;

  /**
   * Clear the current conversation history
   */
  clearConversationHistory: () => void;

  /**
   * Add a new entry to the conversation history
   * @param parentID - The parent ID of the new entry
   * @param role - The role of the new entry ('user' or 'AI')
   * @param message - The message of the new entry
   * @returns The ID of the newly created entry
   */
  addConversationEntry: (parentID: string | null, role: 'user' | 'AI', message: string) => string;

  /**
   * Edit the conversation history
   * @param entryID - The ID of the entry to edit
   * @param newMessage - The new message to replace the entry with
   */
  editConversationEntry: (entryID: string, newMessage: string) => void;

  /**
   * Switch to a different conversation history
   * @param historyID - The ID of the history to switch to
   */
  switchHistory: (historyID: string) => void;

  /**
   * Get the list of conversation histories
   */
  getHistories: () => ConversationHistoryList;

  /**
   * Delete a conversation history
   * @param historyID - The ID of the history to delete
   */
  deleteHistory: (historyID: string) => void;

  /**
   * Get the response for a query, if the currentEntryID is provided, the history will be used from that point
   * @param query - The query to get a response for
   * @param currentEntryID - The current entry ID
   * @returns The response for the query
   */
  getResponseForQuery: (query: string, currentEntryID?: string) => Promise<string>;

  /**
   * Get the response for a query and also fire a view event to send the response in chunks.
   * If the currentEntryID is provided, the history will be used from that point
   * @param query - The query to get a response for
   * @param sendStreamResponse - The callback to send chunks of the response to
   * @param currentEntryID - The current entry ID
   * @returns The response for the query
   */
  getResponseChunksForQuery: (query: string, sendStreamResponse: (msg: string) => void, currentEntryID?: string) => Promise<string>;
}
