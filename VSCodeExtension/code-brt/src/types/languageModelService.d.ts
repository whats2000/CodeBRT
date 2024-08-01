import {
  ConversationHistory,
  ConversationHistoryList,
} from './conversationHistory';

/**
 * The options to get a response for
 * @property query - The query to get a response for
 * @property images - The image paths to use for the query, if not provided, the query will be used without images
 * @property currentEntryID - The current entry ID, if not provided, the history will be used from the latest entry
 * @property sendStreamResponse - The callback to send chunks of the response to,
 * if not provided, the response will be returned without streaming and ill not send partial responses text to frontend
 * @property updateStatus - The callback to update the status if the model is using tools,
 * if not provided, the status will not be updated at frontend
 */
type GetResponseOptions = {
  query: string;
  images?: string[];
  currentEntryID?: string;
  sendStreamResponse?: (message: string) => void;
  updateStatus?: (status: string) => void;
};

export type LanguageModelService = {
  /**
   * Update the available models
   * @param newAvailableModels - The new available models
   */
  updateAvailableModels: (newAvailableModels: string[]) => void;

  /**
   * Get the latest version of the language model service
   */
  getLatestAvailableModelNames: () => Promise<string[]>;

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
   * Switch to a different model
   * @param newModel - The name of the model to switch to
   */
  switchModel: (newModel: string) => void;

  /**
   * Get the response for a query with an image and also fire a view event to send the response in chunks.
   * If the currentEntryID is provided
   * @param options - The options to get a response for
   * @returns The response for the query
   * @see GetResponseOptions
   */
  getResponse: (options: GetResponseOptions) => Promise<string>;

  /**
   *
   */
  stopResponse: () => void;
};
