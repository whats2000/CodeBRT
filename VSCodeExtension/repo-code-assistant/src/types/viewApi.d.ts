import {
  CustomModelSettings,
  ExtensionSettings,
  GptSoVitsVoiceSetting,
} from './extensionSettings';
import {
  ConversationHistory,
  ConversationHistoryList,
} from './conversationHistory';
import { ModelServiceType } from './modelServiceType';
import { VoiceServiceType } from './voiceServiceType';

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
  getLanguageModelResponse: (
    query: string,
    modelType: ModelServiceType,
    useStream?: boolean,
    currentEntryID?: string,
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
   * Send a stream response chunk.
   * @param msg - The message chunk to add.
   */
  sendStreamResponse: (msg: string) => void;

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
   * Set the available models for a language model.
   * @param modelType - The type of the model to set the available models for.
   * @param newAvailableModels - The new available models.
   */
  setAvailableModels: (
    modelType: ModelServiceType,
    newAvailableModels: string[],
  ) => void;

  /**
   * Switch to a different model.
   * @param modelType - The type of the model to switch to.
   * @param modelName - The name of the model to switch to.
   */
  switchModel: (modelType: ModelServiceType, modelName: string) => void;

  /**
   * Get the response for a query with an image.
   * @param query - The query to get a response for.
   * @param modelType - The type of the model to use.
   * @param images - The images paths to use.
   * @param currentEntryID - The current entry ID.
   * @returns The response.
   */
  getLanguageModelResponseWithImage: (
    query: string,
    modelType: ModelServiceType,
    images: string[],
    currentEntryID?: string,
  ) => Promise<string>;

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
  getWebviewUri: (absolutePath: string) => string;

  /**
   * Get the custom models settings list.
   */
  getCustomModels: () => CustomModelSettings[];

  /**
   * Set the custom models settings list.
   * @param newCustomModelSettings - The new custom model settings.
   */
  setCustomModels: (newCustomModelSettings: CustomModelSettings[]) => void;

  /**
   * Convert text to voice and play it.
   * @param voiceServiceType - The type of the voice service to use.
   * @param text - The text to convert to voice.
   */
  convertTextToVoice: (
    voiceServiceType: VoiceServiceType,
    text: string,
  ) => Promise<void>;

  /**
   * Start recording voice.
   * After recording, the voice will be converted to text.
   * @param voiceServiceType - The type of the voice service to use.
   * @returns The recorded voice as text.
   */
  convertVoiceToText: (voiceServiceType: VoiceServiceType) => Promise<string>;

  /**
   * Stop the voice which is being played.
   * @param voiceServiceType - The type of the voice service to stop.
   */
  stopPlayVoice: (voiceServiceType: VoiceServiceType) => void;

  /**
   * Switch the reference voice for GPT-SoVits.
   * @param voiceName - The name of the reference voice to switch to.
   */
  switchGptSoVitsReferenceVoice: (voiceName: string) => void;

  /**
   * Get the selected reference voice for GPT-SoVits.
   */
  getSelectedGptSoVitsReferenceVoice: () => GptSoVitsVoiceSetting | undefined;

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
   * Example event A.
   * @param a - Example parameter A.
   */
  exampleBMessage: (a: string) => void;

  /**
   * Stream response event.
   * @param a - The message chunk to stream.
   */
  streamResponse: (a: string) => void;
};
