import { CustomModelSettings, ExtensionSettings } from './extensionSettings';
import {
  ConversationEntry,
  ConversationHistory,
  ConversationHistoryIndexList,
  ConversationModelAdvanceSettings,
  ToolCallEntry,
  ToolCallResponse,
} from './conversationHistory';
import {
  AddConversationEntryParams,
  ModelServiceType,
  ResponseWithAction,
} from '../types';

/**
 * Represents the API request structure for the view.
 */
export type ViewApiRequest<K extends keyof ViewApi = keyof ViewApi> = {
  type: 'request';
  id: string;
  key: K;
  params: Parameters<ViewApi[K]>;
};

/**
 * Represents the API response structure for the view.
 */
export type ViewApiResponse = {
  type: 'response';
  id: string;
  value: unknown;
};

/**
 * Represents the API error structure for the view.
 */
export type ViewApiError = {
  type: 'error';
  id: string;
  value: string;
};

/**
 * Represents the API event structure for the view.
 */
export type ViewApiEvent<K extends keyof ViewEvents = keyof ViewEvents> = {
  type: 'event';
  key: K;
  value: Parameters<ViewEvents[K]>;
};

/**
 * Represents the API structure for the getLanguageModelResponse method.
 * @property modelServiceType - The type of the model service to get the response for.
 * @property query - The query to get the response for.
 * @property images - The image paths to use for the query, if not provided, the query will be used without images.
 * @property currentEntryID - The current entry ID, if not provided, the history will be used from the latest entry.
 * @property useStream - Whether to use streaming for the response.
 * @property showStatus - Whether to show the status if the model is using tools.
 * @property toolCallResponse - The tool call response to use for the query.
 */
export type GetLanguageModelResponseParams = {
  modelServiceType: ModelServiceType;
  query: string;
  images?: string[];
  currentEntryID?: string;
  useStream?: boolean;
  showStatus?: boolean;
  toolCallResponse?: ToolCallResponse;
};

/**
 * Defines the API for the view.
 * If a new API method is added, it should be added here as well.
 */
export type ViewApi = {
  /**
   * Set the target setting of the extension.
   * @param key - The key of the setting to set.
   * @param value - The new value of the setting.
   * @returns A promise that resolves when the setting is updated.
   */
  setSettingByKey: (
    key: keyof ExtensionSettings,
    value: ExtensionSettings[typeof key],
  ) => Promise<void>;

  /**
   * Get the target setting of the extension.
   * @param key - The key of the setting to get.
   * @returns The value of the setting.
   */
  getSettingByKey: (
    key: keyof ExtensionSettings,
  ) => ExtensionSettings[typeof key];

  /**
   * Get all settings of the extension.
   * @returns The settings of the extension.
   */
  getAllSettings: () => Promise<ExtensionSettings>;

  /**
   * Show an alert message.
   * @param msg - The message to show.
   * @param type - The type of the message in ["info", "warning", "error"]
   * @param selections - The selections to show.
   * And invoke the command when selected.
   */
  alertMessage: (
    msg: string,
    type: 'info' | 'warning' | 'error',
    selections?: {
      text: string;
      commandArgs: string[];
    }[],
  ) => void;

  /**
   * Get the response for a query.
   * @param modelServiceType - The type of the model service to get the response for.
   * @param query - The query to get the response for.
   * @param images - The image paths to use for the query, if not provided, the query will be used without images.
   * @param currentEntryID - The current entry ID, if not provided, the history will be used from the latest entry.
   * @param useStream - Whether to use streaming for the response.
   * @param useStatus - Whether to show the status if the model is using tools.
   * @param toolCallResponse - The tool call response to use for the query.
   */
  getLanguageModelResponse: (
    options: GetLanguageModelResponseParams,
  ) => Promise<ResponseWithAction>;

  /**
   * Stop the language model response.
   * @param modelServiceType - The type of the model service to stop.
   */
  stopLanguageModelResponse: (modelServiceType: ModelServiceType) => void;

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
   * Get the available models for a language model.
   * @param modelServiceType - The type of the model to get the available models for.
   */
  getAvailableModels: (modelServiceType: ModelServiceType) => string[];

  /**
   * Get the current model for a language model.
   * @param modelServiceType - The type of the model to get the current model for.
   */
  getCurrentModel: (modelServiceType: ModelServiceType) => string;

  /**
   * Set the available models for a language model.
   * @param modelServiceType - The type of the model to set the available models for.
   * @param newAvailableModels - The new available models.
   */
  setAvailableModels: (
    modelServiceType: Exclude<ModelServiceType, 'custom'>,
    newAvailableModels: string[],
  ) => void;

  /**
   * Set the custom models.
   * @param newCustomModels - The new custom models.
   * @returns The new custom models.
   */
  setCustomModels: (newCustomModels: CustomModelSettings[]) => void;

  /**
   * Switch to a different model.
   * @param modelServiceType - The type of the model to switch to.
   * @param modelName - The name of the model to switch to.
   */
  switchModel: (modelServiceType: ModelServiceType, modelName: string) => void;

  /**
   * Get the latest available model names.
   * @param modelServiceType - The type of the model to get the latest available model names for.
   */
  getLatestAvailableModelNames: (
    modelServiceType: ModelServiceType,
  ) => Promise<string[]>;

  /**
   * Get the response for a query with a file.
   * @param base64Data - The base64 data of the file.
   * @param originalFileName - The original filename.
   * @returns The path of the file.
   */
  uploadFile: (base64Data: string, originalFileName: string) => Promise<string>;

  /**
   * Delete an image.
   * @param filePath - The path of the file to delete.
   * Only work for user uploaded files.
   */
  deleteFile: (filePath: string) => Promise<void>;

  /**
   * Get the webview URI for a path.
   * @param absolutePath - The absolute path to get the URI for.
   */
  getWebviewUri: (absolutePath: string) => Promise<string>;

  /**
   * Convert text to voice and play it.
   * @param text - The text to convert to voice.
   */
  convertTextToVoice: (text: string) => Promise<void>;

  /**
   * Start recording voice.
   * After recording, the voice will be converted to text.
   * @returns The recorded voice as text.
   */
  convertVoiceToText: () => Promise<string>;

  /**
   * Stop the voice which is being played.
   * @param voiceServiceType - The type of the voice service to stop.
   */
  stopPlayVoice: () => void;

  /**
   * Stop the voice which is being recorded.
   */
  stopRecordVoice: () => void;

  /**
   * Switch the reference voice for GPT-SoVits.
   * @param voiceName - The name of the reference voice to switch to.
   */
  switchGptSoVitsReferenceVoice: (voiceName: string) => void;

  /**
   * Open an external link in the default browser.
   * @param url - The URL to open.
   */
  openExternalLink: (url: string) => Promise<void>;

  /**
   * Open the keyboard shortcut settings for specific command.
   * @param commandId - The command ID to open the keyboard shortcut settings for.
   */
  openKeyboardShortcuts: (commandId: string) => Promise<void>;

  /**
   * Open marketplace page for target extension.
   * @param extensionId - The extension ID to open the marketplace page for.
   */
  openExtensionMarketplace: (extensionId: string) => Promise<void>;

  /**
   * Approve the tool call.
   * @param toolCall - The tool call to approve.
   * @returns The response of the tool call.
   */
  approveToolCall: (toolCall: ToolCallEntry) => Promise<ToolCallResponse>;

  /**
   * Continue with the action made by the tool call.
   * And let the model continue.
   * @param entry - The conversation entry to confirm the tool call for.
   */
  continueWithToolCallResponse: (entry: ConversationEntry) => Promise<void>;
};

/**
 * Defines the events that the view can trigger.
 */
export type ViewEvents = {
  /**
   * Stream response event.
   * @param message - The message chunk to stream.
   */
  streamResponse: (message: string) => void;

  /**
   * Update status event.
   * @param status - The status to update.
   */
  updateStatus: (status: string) => void;
};
