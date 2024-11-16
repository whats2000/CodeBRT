import {
  ModelServiceType,
  ResponseWithAction,
} from '../../../services/languageModel/types';
import { CustomModelSettings, OpenRouterModelSettings } from '../../../types';

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

export type LanguageModelServiceApi = {
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
   */
  setCustomModels: (newCustomModels: CustomModelSettings[]) => void;

  /**
   * Set the open router models.
   * @param newOpenRouterModels - The new open router models.
   */
  setOpenRouterModels: (newOpenRouterModels: OpenRouterModelSettings[]) => void;

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
   * Get the latest available models with more details.
   */
  getLatestAvailableModels: () => Promise<OpenRouterModelSettings[]>;
};
