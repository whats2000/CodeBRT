/**
 * The conversation history types
 */
export type ConversationEntry = {
  /**
   * The unique identifier of the entry
   */
  id: string;

  /**
   * The role of the entry ('user' or 'AI')
   */
  role: 'user' | 'AI';

  /**
   * The message of the entry
   */
  message: string;

  /**
   * The images referenced by the entry
   */
  images?: string[];

  /**
   * The parent ID of the entry
   */
  parent: string | null;

  /**
   * The children of the entry
   */
  children: string[];
};

/**
 * A conversation history
 */
export type ConversationHistory = {
  /**
   * The title of the conversation history
   */
  title: string;

  /**
   * The creation time of the conversation history
   */
  create_time: number;

  /**
   * The update time of the conversation history
   */
  update_time: number;

  /**
   * The root entry of the conversation history
   */
  root: string;

  /**
   * The current entry of the conversation history
   */
  current: string;

  /**
   * The entries of the conversation history
   */
  entries: { [key: string]: ConversationEntry };
};

/**
 * A list of conversation histories
 */
export type ConversationHistoryList = {
  /**
   * The conversation histories
   */
  [key: string]: ConversationHistory;
};
