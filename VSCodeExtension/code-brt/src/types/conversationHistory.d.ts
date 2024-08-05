/**
 * The conversation history types
 * @property id - The unique identifier of the entry
 * @property role - The role of the entry ('user' or 'AI')
 * @property message - The message of the entry
 * @property images - The images referenced by the entry in path
 * @property parent - The parent ID of the entry
 * @property children - The children's ID of the entry
 */
export type ConversationEntry = {
  id: string;
  role: 'user' | 'AI';
  message: string;
  images?: string[];
  parent: string | null;
  children: string[];
};

/**
 * A conversation history
 * @property title - The title of the conversation history
 * @property create_time - The creation time of the conversation history
 * @property update_time - The update time of the conversation history
 * @property root - The root entry of the conversation history
 * @property top - Top entries in the conversation history
 * @property current - The current entry of the conversation history
 * @property entries - The entries of the conversation history
 */
export type ConversationHistory = {
  title: string;
  create_time: number;
  update_time: number;
  root: string;
  top: string[];
  current: string;
  entries: { [key: string]: ConversationEntry };
};

/**
 * A conversation history index
 * @property id - The unique identifier of the history
 * @property title - The title of the history
 * @property create_time - The creation time of the history
 * @property update_time - The update time of the history
 */
export type ConversationHistoryIndex = {
  id: string;
  title: string;
  create_time: number;
  update_time: number;
};

/**
 * A list of conversation histories index
 */
export type ConversationHistoryList = {
  [key: string]: ConversationHistoryIndex;
};
