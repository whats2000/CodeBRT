import { CustomModelSettings, ExtensionSettings } from './extensionSettings';
import {
  ConversationHistory,
  ConversationHistoryList,
} from './conversationHistory';
import { ModelServiceType } from './modelServiceType';

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
 * Defines the API for the view.
 * If a new API method is added, it should be added here as well.
 */
export type ViewApi = {
  /**
   * Get the contents of the file.
   */
  getFileContents: () => Promise<string>;

  /**
   * Set the target setting of the extension.
   * @param key - The key of the setting to set.
   * @param value - The new value of the setting.
   * @returns A promise that resolves when the setting is updated.
   */
  setSetting: (
    key: keyof ExtensionSettings,
    value: ExtensionSettings[typeof key],
  ) => Promise<void>;

  /**
   * Get the target setting of the extension.
   * @param key - The key of the setting to get.
   * @returns The value of the setting.
   */
  getSetting: (key: keyof ExtensionSettings) => ExtensionSettings[typeof key];

  /**
   * Show an alert message.
   * @param msg - The message to show.
   * @param type - The type of the message in ["info", "warning", "error"]
   */
  alertMessage: (msg: string, type: 'info' | 'warning' | 'error') => void;

  /**
   * Get the response for a query.
   * @param modelType - The type of the model to get the response for.
   * @param query - The query to get the response for.
   * @param images - The image paths to use for the query, if not provided, the query will be used without images.
   * @param currentEntryID - The current entry ID, if not provided, the history will be used from the latest entry.
   * @param useStream - Whether to use streaming for the response.
   * @param useStatus - Whether to show the status if the model is using tools.
   */
  getLanguageModelResponse: (
    modelType: ModelServiceType,
    query: string,
    images?: string[],
    currentEntryID?: string,
    useStream?: boolean,
    showStatus?: boolean,
  ) => Promise<string>;

  /**
   * Get the conversation history for a language model.
   * @param modelType - The type of the model to get the conversation history for.
   * @returns The conversation history.
   */
  getLanguageModelConversationHistory: (
    modelType: ModelServiceType,
  ) => ConversationHistory;

  /**
   * Add a new conversation history for a language model.
   * @param modelType - The type of the model to add the conversation history for.
   * @returns The new conversation history.
   */
  addNewConversationHistory: (
    modelType: ModelServiceType,
  ) => ConversationHistory;

  /**
   * Edit the conversation history for a language model.
   * @param modelType - The type of the model to edit the conversation history for.
   * @param entryID - The ID of the entry to edit.
   * @param newMessage - The new message to set.
   */
  editLanguageModelConversationHistory: (
    modelType: ModelServiceType,
    entryID: string,
    newMessage: string,
  ) => void;

  /**
   * Add a conversation entry to the conversation history for a language model.
   * @param modelType - The type of the model to add the conversation entry to.
   * @param parentID - The ID of the parent entry.
   * @param sender - The sender of the message.
   * @param message - The message to add.
   * @param images - The images to add.
   * @returns The ID of the new entry.
   */
  addConversationEntry: (
    modelType: ModelServiceType,
    parentID: string,
    sender: 'user' | 'AI',
    message: string,
    images?: string[],
  ) => Promise<string>;

  /**
   * Edit a conversation entry in the conversation history for a language model.
   * @param modelType - The type of the model to edit the conversation entry in.
   */
  getHistories: (modelType: ModelServiceType) => ConversationHistoryList;

  /**
   * Switch the conversation history for a language model.
   * @param modelType - The type of the model to switch the conversation history for.
   * @param historyID - The ID of the history to switch to.
   */
  switchHistory: (modelType: ModelServiceType, historyID: string) => void;

  /**
   * Delete a conversation history for a language model.
   * @param modelType - The type of the model to delete the conversation history for.
   * @param historyID - The ID of the history to delete.
   * @returns The new conversation history.
   */
  deleteHistory: (
    modelType: ModelServiceType,
    historyID: string,
  ) => ConversationHistory;

  /**
   * Edit the specified history title.
   * @param modelType - The type of the model to edit the history title for.
   * @param historyID - The ID of the history to edit.
   * @param title - The new title.
   */
  updateHistoryTitleById: (
    modelType: ModelServiceType,
    historyID: string,
    title: string,
  ) => void;

  /**
   * Get the available models for a language model.
   * @param modelType - The type of the model to get the available models for.
   */
  getAvailableModels: (modelType: ModelServiceType) => string[];

  /**
   * Get the current model for a language model.
   * @param modelType - The type of the model to get the current model for.
   */
  getCurrentModel: (modelType: ModelServiceType) => string;

  /**
   * Set the available models for a language model.
   * @param modelType - The type of the model to set the available models for.
   * @param newAvailableModels - The new available models.
   */
  setAvailableModels: (
    modelType: Exclude<ModelServiceType, 'custom'>,
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
   * @param modelType - The type of the model to switch to.
   * @param modelName - The name of the model to switch to.
   */
  switchModel: (modelType: ModelServiceType, modelName: string) => void;

  /**
   * Get the latest available model names.
   * @param modelType - The type of the model to get the latest available model names for.
   */
  getLatestAvailableModelNames: (
    modelType: ModelServiceType,
  ) => Promise<string[]>;

  /**
   * Get the response for a query with a file.
   * @param base64Data - The base64 data of the file.
   * @returns The path of the file.
   */
  uploadImage: (base64Data: string) => Promise<string>;

  /**
   * Delete an image.
   * @param imagePath - The path of the image to delete.
   */
  deleteImage: (imagePath: string) => Promise<void>;

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
   * Switch the reference voice for GPT-SoVits.
   * @param voiceName - The name of the reference voice to switch to.
   */
  switchGptSoVitsReferenceVoice: (voiceName: string) => void;

  /**
   * Open an external link in the default browser.
   * @param url - The URL to open.
   */
  openExternalLink: (url: string) => Promise<void>;
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
