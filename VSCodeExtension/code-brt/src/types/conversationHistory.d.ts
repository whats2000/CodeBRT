export type ConversationEntryRole = 'user' | 'AI' | 'tool';

/**
 * The tool call entry type
 * @property id - The unique identifier of the tool call entry
 * @property toolName - The name of the tool that was called
 * @property parameters - The parameters passed to the tool
 * @property create_time - The creation time of the tool call entry
 */
export type ToolCallEntry = {
  id: string;
  toolName: string;
  parameters: Record<string, any>;
  create_time: number;
};

/**
 * The tool call response type
 * @property id - The unique identifier of the tool call response entry
 * @property toolCallId - The ID of the corresponding tool call
 * @property result - The result returned by the tool
 * @property status - The status of the tool call (e.g., 'success', 'error')
 * @property create_time - The creation time of the tool call response entry
 */
export type ToolCallResponse = {
  id: string;
  toolCallName: string;
  result: Record<string, any> | string;
  status: 'success' | 'error' | 'rejectByUser';
  create_time: number;
};

/**
 * The conversation history types
 * @property id - The unique identifier of the entry
 * @property role - The role of the entry in ['user' or 'AI' or 'tool']
 * @property message - The message of the entry
 * @property images - The images referenced by the entry in path
 * @property files - The files referenced by the entry in path
 * @property toolCalls - The tool calls made by the entry
 * @property toolResponses - The tool responses made by the entry
 * @property modelName - The model name used by the entry
 * @property parent - The parent ID of the entry
 * @property children - The children's ID of the entry
 */
export type ConversationEntry = {
  id: string;
  role: ConversationEntryRole;
  message: string;
  images?: string[];
  files?: string[];
  toolCalls?: ToolCallEntry[];
  toolResponses?: ToolCallResponse[];
  modelName?: string;
  parent: string | null;
  children: string[];
};

/**
 * The settings for the conversation model
 * @property systemPrompt - The system prompt for the model
 * @property maxTokens - The maximum number of tokens to generate
 * @property temperature - The temperature of the model
 * @property topP - The nucleus sampling parameter
 * @property topK - The top k sampling parameter
 * @property presencePenalty - The presence penalty
 * @property frequencyPenalty - The frequency penalty
 */
export type ConversationModelAdvanceSettings = {
  systemPrompt: string;
  maxTokens: number | undefined;
  temperature: number | undefined;
  topP: number | undefined;
  topK: number | undefined;
  presencePenalty: number | undefined;
  frequencyPenalty: number | undefined;
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
  create_time: number;
  update_time: number;
  root: string;
  top: string[];
  current: string;
  advanceSettings: ConversationModelAdvanceSettings;
  entries: { [key: string]: ConversationEntry };
};

/**
 * A conversation history index
 * @property id - The unique identifier of the history
 * @property title - The title of the history
 * @property create_time - The creation time of the history
 * @property update_time - The update time of the history
 * @property tags - The tags associated with the history for classification
 */
export type ConversationHistoryIndex = {
  id: string;
  title: string;
  create_time: number;
  update_time: number;
  tags?: string[];
};

/**
 * A list of conversation histories index
 */
export type ConversationHistoryIndexList = {
  [key: string]: ConversationHistoryIndex;
};
