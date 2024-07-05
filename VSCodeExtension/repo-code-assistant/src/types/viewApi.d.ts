import {
  CustomModelSettings,
  ExtensionSettings,
  GptSoVitsVoiceSetting,
} from './extensionSettings';
import {
  ConversationHistory,
  ConversationHistoryList,
} from './conversationHistory';
import { ModelType } from './modelType';
import { VoiceType } from './voiceType';

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
   * Update the settings of the extension.
   * @param key - The key of the setting to update.
   * @param value - The new value of the setting.
   * @returns A promise that resolves when the setting is updated.
   */
  updateSetting: (
    key: keyof ExtensionSettings,
    value: ExtensionSettings[typeof key],
  ) => Promise<void>;

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
    modelType: ModelType,
    useStream?: boolean,
    currentEntryID?: string,
  ) => Promise<string>;

  /**
   * Get the conversation history for a language model.
   * @param modelType - The type of the model to get the conversation history for.
   * @returns The conversation history.
   */
  getLanguageModelConversationHistory: (
    modelType: ModelType,
  ) => ConversationHistory;

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
  editLanguageModelConversationHistory: (
    modelType: ModelType,
    entryID: string,
    newMessage: string,
  ) => void;

  /**
   * Send a stream response chunk.
   * @param msg - The message chunk to add.
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
   * @param images - The images to add.
   * @returns The ID of the new entry.
   */
  addConversationEntry: (
    modelType: ModelType,
    parentID: string,
    sender: 'user' | 'AI',
    message: string,
    images?: string[],
  ) => Promise<string>;

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
  deleteHistory: (
    modelType: ModelType,
    historyID: string,
  ) => ConversationHistory;

  /**
   * Edit the specified history title.
   * @param modelType - The type of the model to edit the history title for.
   * @param historyID - The ID of the history to edit.
   * @param title - The new title.
   */
  updateHistoryTitleById: (
    modelType: ModelType,
    historyID: string,
    title: string,
  ) => void;

  /**
   * Get the available models for a language model.
   * @param modelType - The type of the model to get the available models for.
   */
  getAvailableModels: (modelType: ModelType) => string[];

  /**
   * Set the available models for a language model.
   * @param modelType - The type of the model to set the available models for.
   * @param newAvailableModels - The new available models.
   */
  setAvailableModels: (
    modelType: ModelType,
    newAvailableModels: string[],
  ) => void;

  /**
   * Switch to a different model.
   * @param modelType - The type of the model to switch to.
   * @param modelName - The name of the model to switch to.
   */
  switchModel: (modelType: ModelType, modelName: string) => void;

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
    modelType: ModelType,
    images: string[],
    currentEntryID?: string,
  ) => Promise<string>;

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
   * Add a custom model.
   * @param model - The custom model settings to add.
   */
  addCustomModel: (model: CustomModelSettings) => void;

  /**
   * Set the custom models settings list.
   * @param newCustomModelSettings - The new custom model settings.
   */
  setCustomModels: (newCustomModelSettings: CustomModelSettings[]) => void;

  /**
   * Add a custom model.
   * @param modelName - The name of the custom model.
   */
  deleteCustomModel: (modelName: string) => void;

  /**
   * Convert text to voice and play it.
   * @param voiceServiceType - The type of the voice service to use.
   * @param text - The text to convert to voice.
   */
  convertTextToVoice: (
    voiceServiceType: VoiceType,
    text: string,
  ) => Promise<void>;

  /**
   * Start recording voice.
   * After recording, the voice will be converted to text.
   * @param voiceServiceType - The type of the voice service to use.
   * @returns The recorded voice as text.
   */
  convertVoiceToText: (voiceServiceType: VoiceType) => Promise<string>;

  /**
   * Get the selected voice service.
   * @returns The selected voice services.
   */
  getSelectedVoiceService: () => {
    textToVoice: VoiceType;
    voiceToText: VoiceType;
  };

  /**
   * Save the selected text to voice service.
   * @param voiceServiceType - The type of the voice service to save.
   */
  saveSelectedTextToVoiceService: (voiceServiceType: VoiceType) => void;

  /**
   * Save the selected voice to text service.
   * @param voiceServiceType - The type of the voice service to save.
   */
  saveSelectedVoiceToTextService: (voiceServiceType: VoiceType) => void;

  /**
   * Get the available reference voices for GPT-SoVits.
   */
  getGptSoVitsAvailableReferenceVoices: () => GptSoVitsVoiceSetting[];

  /**
   * Add a reference voice for GPT-SoVits.
   * @param voice - The reference voice to add.
   */
  addGptSoVitsReferenceVoice: (voice: GptSoVitsVoiceSetting) => void;

  /**
   * Set the available reference voices for GPT-SoVits.
   * @param newVoices - The new reference voices.
   */
  setGptSoVitsAvailableReferenceVoices: (
    newVoices: GptSoVitsVoiceSetting[],
  ) => void;

  /**
   * Delete a reference voice for GPT-SoVits.
   * @param voiceName - The name of the reference voice to delete.
   */
  deleteGptSoVitsReferenceVoice: (voiceName: string) => void;

  /**
   * Switch the reference voice for GPT-SoVits.
   * @param voiceName - The name of the reference voice to switch to.
   */
  switchGptSoVitsReferenceVoice: (voiceName: string) => void;

  /**
   * Get the selected reference voice for GPT-SoVits.
   */
  getSelectedGptSoVitsReferenceVoice: () => GptSoVitsVoiceSetting | undefined;
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
