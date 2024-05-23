import {
  ConversationHistory,
  ConversationHistoryList,
} from './conversationHistory';

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
   * Add a new conversation history
   * @returns The new conversation history
   */
  addNewConversationHistory: () => ConversationHistory;

  /**
   * Add a new entry to the conversation history
   * @param parentID - The parent ID of the new entry
   * @param role - The role of the new entry ('user' or 'AI')
   * @param message - The message of the new entry
   * @param images - The images of the new entry
   * @returns The ID of the newly created entry
   */
  addConversationEntry: (
    parentID: string | null,
    role: 'user' | 'AI',
    message: string,
    images?: string[],
  ) => string;

  /**
   * Edit the conversation history
   * @param entryID - The ID of the entry to edit
   * @param newMessage - The new message to replace the entry with
   */
  editConversationEntry: (entryID: string, newMessage: string) => void;

  /**
   * Update the title of the specified history
   * @param historyID - The ID of the history to update
   * @param title - The new title
   */
  updateHistoryTitleById: (historyID: string, title: string) => void;

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
   * @returns The deleted conversation history
   */
  deleteHistory: (historyID: string) => ConversationHistory;

  /**
   * Get the available models
   */
  getAvailableModels: () => string[];

  /**
   * Switch to a different model
   * @param newModel - The name of the model to switch to
   */
  switchModel: (newModel: string) => void;

  /**
   * Get the response for a query, if the currentEntryID is provided, the history will be used from that point
   * @param query - The query to get a response for
   * @param currentEntryID - The current entry ID
   * @returns The response for the query
   */
  getResponseForQuery: (
    query: string,
    currentEntryID?: string,
  ) => Promise<string>;

  /**
   * Get the response for a query and also fire a view event to send the response in chunks.
   * If the currentEntryID is provided, the history will be used from that point
   * @param query - The query to get a response for
   * @param sendStreamResponse - The callback to send chunks of the response to
   * @param currentEntryID - The current entry ID
   * @returns The response for the query
   */
  getResponseChunksForQuery: (
    query: string,
    sendStreamResponse: (msg: string) => void,
    currentEntryID?: string,
  ) => Promise<string>;

  /**
   * Get the response for a query with an image
   * @param query - The query to get a response for
   * @param images - The images paths to use
   * @param sendStreamResponse - The callback to send chunks of the response to
   * @param currentEntryID - The current entry ID
   * @returns The response for the query
   */
  getResponseChunksForQueryWithImage: (
    query: string,
    images: string[],
    sendStreamResponse: (msg: string) => void,
    currentEntryID?: string,
  ) => Promise<string>;
}
