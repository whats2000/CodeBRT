import { ExtensionSettings } from "./extensionSettings";
import { ConversationHistory, ConversationHistoryList } from "./conversationHistory";
import { ModelType } from "./modelType";

/**
 * Represents the API request structure for the view.
 */
export type ViewApiRequest<K extends keyof ViewApi = keyof ViewApi> = {
  type: "request";
  id: string;
  key: K;
  params: Parameters<ViewApi[K]>;
};

/**
 * Represents the API response structure for the view.
 */
export type ViewApiResponse = {
  type: "response";
  id: string;
  value: unknown;
};

/**
 * Represents the API error structure for the view.
 */
export type ViewApiError = {
  type: "error";
  id: string;
  value: string;
};

/**
 * Represents the API event structure for the view.
 */
export type ViewApiEvent<K extends keyof ViewEvents = keyof ViewEvents> = {
  type: "event";
  key: K;
  value: Parameters<ViewEvents[K]>;
};

/**
 * Defines the API for the view.
 * If a new API method is added, it should be added here as well.
 */
export type ViewApi = {
  /**
   * Get the contents of the file.
   */
  getFileContents: () => Promise<string>;

  /**
   * Show the settings view.
   */
  showSettingsView: () => void;

  /**
   * Update the settings of the extension.
   * @param key - The key of the setting to update.
   * @param value - The new value of the setting.
   * @returns A promise that resolves when the setting is updated.
   */
  updateSetting: (key: keyof ExtensionSettings, value: ExtensionSettings[typeof key]) => Promise<void>;

  /**
   * Get the settings of the extension.
   * @param key - The key of the setting to get.
   * @returns The value of the setting.
   */
  getSetting: (key: keyof ExtensionSettings) => ExtensionSettings[typeof key];

  /**
   * Show an alert message.
   * @param msg - The message to show.
   * @param type - The type of the message in ["info", "warning", "error"]
   */
  alertMessage: (msg: string, type: "info" | "warning" | "error") => void;

  /**
   * Send a message to Example B.
   * @param msg - The message to send.
   */
  sendMessageToExampleB: (msg: string) => void;

  /**
   * Get the response for a query.
   * @param query - The query to get a response for.
   * @param modelType - The type of the model to use.
   * @param useStream - Whether to use the stream response.
   * @param currentEntryID - The current entry ID.
   */
  getLanguageModelResponse: (query: string, modelType: ModelType, useStream?: boolean, currentEntryID?: string) => Promise<string>;

  /**
   * Get the conversation history for a language model.
   * @param modelType - The type of the model to get the conversation history for.
   * @returns The conversation history.
   */
  getLanguageModelConversationHistory: (modelType: ModelType) => ConversationHistory;

  /**
   * Add a new conversation history for a language model.
   * @param modelType - The type of the model to add the conversation history for.
   * @returns The new conversation history.
   */
  addNewConversationHistory: (modelType: ModelType) => ConversationHistory;

  /**
   * Edit the conversation history for a language model.
   * @param modelType - The type of the model to edit the conversation history for.
   * @param entryID - The ID of the entry to edit.
   * @param newMessage - The new message to set.
   */
  editLanguageModelConversationHistory: (modelType: ModelType, entryID: string, newMessage: string) => void;

  /**
   * Add a conversation entry to the conversation history for a language model.
   * @param msg - The message to add.
   */
  sendStreamResponse: (msg: string) => void;

  /**
   * Save the last used model.
   * @param modelType - The type of the model to save.
   */
  saveLastUsedModel: (modelType: ModelType) => void;

  /**
   * Get the last used model.
   * @returns The last used model.
   */
  getLastUsedModel: () => ModelType;

  /**
   * Add a conversation entry to the conversation history for a language model.
   * @param modelType - The type of the model to add the conversation entry to.
   * @param parentID - The ID of the parent entry.
   * @param sender - The sender of the message.
   * @param message - The message to add.
   * @returns The ID of the new entry.
   */
  addConversationEntry: (modelType: ModelType, parentID: string, sender: "user" | "AI", message: string) => Promise<string>;

  /**
   * Edit a conversation entry in the conversation history for a language model.
   * @param modelType - The type of the model to edit the conversation entry in.
   */
  getHistories: (modelType: ModelType) => ConversationHistoryList;

  /**
   * Switch the conversation history for a language model.
   * @param modelType - The type of the model to switch the conversation history for.
   * @param historyID - The ID of the history to switch to.
   */
  switchHistory: (modelType: ModelType, historyID: string) => void;

  /**
   * Delete a conversation history for a language model.
   * @param modelType - The type of the model to delete the conversation history for.
   * @param historyID - The ID of the history to delete.
   * @returns The new conversation history.
   */
  deleteHistory: (modelType: ModelType, historyID: string) => ConversationHistory;

  /**
   * Edit the specified history title.
   * @param modelType - The type of the model to edit the history title for.
   * @param historyID - The ID of the history to edit.
   * @param title - The new title.
   */
  updateHistoryTitleById: (modelType: ModelType, historyID: string, title: string) => void;
};

/**
 * Defines the events that the view can trigger.
 */
export type ViewEvents = {
  /**
   * Example event A.
   * @param a - Example parameter A.
   */
  exampleBMessage: (a: string) => void;

  /**
   * Example event B.
   * @param a - Example parameter A.
   */
  streamResponse: (a: string) => void;
};
