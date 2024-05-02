import { ExtensionSettings } from "./extensionSettings";
import { ConversationHistory } from "./conversationHistory";
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
  getFileContents: () => Promise<string>;
  showSettingsView: () => void;
  updateSetting: (key: keyof ExtensionSettings, value: ExtensionSettings[typeof key]) => Promise<void>;
  getSetting: (key: keyof ExtensionSettings) => ExtensionSettings[typeof key];
  alertMessage: (msg: string, type: "info" | "warning" | "error") => void;
  sendMessageToExampleB: (msg: string) => void;
  getLanguageModelResponse: (query: string, modelType: ModelType) => Promise<string>;
  getLanguageModelConversationHistory: (modelType: ModelType) => ConversationHistory;
  clearLanguageConversationHistory: (modelType: ModelType) => void;
};

/**
 * Defines the events that the view can trigger.
 */
export type ViewEvents = {
  exampleBMessage: (a: string) => void;
};
