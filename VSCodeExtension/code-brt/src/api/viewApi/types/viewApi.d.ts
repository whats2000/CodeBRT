import type { ModelServiceType, ToolCallResponse } from '../../../types';
import { SettingApi } from './settingApi';
import { LanguageModelServiceApi } from './languageModelServiceApi';
import { HistoryManagerApi } from './historyManagerApi';
import { VoiceServiceApi } from './voiceServiceApi';
import { MiscApi } from './miscApi';
import { EditorApi } from './editorApi';
import { codeText } from 'micromark-core-commonmark';

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
export type ViewApi = EditorApi &
  SettingApi &
  LanguageModelServiceApi &
  HistoryManagerApi &
  VoiceServiceApi &
  MiscApi;

export type SelectedCode = {
  codeText: string;
  codeLanguage: string;
  relativePath: string;
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

  /**
   * Send code to chat view.
   * @param selectedCode - The selected code to send to chat.
   */
  sendCodeToChat: (selectedCode: SelectedCode) => void;
};
