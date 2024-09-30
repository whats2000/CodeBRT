/**
 * The options to get a response for
 * @property query - The query to get a response for
 * @property historyManager - The history manager to use for the query
 * @property images - The image paths to use for the query, if not provided, the query will be used without images
 * @property currentEntryID - The current entry ID, if not provided, the history will be used from the latest entry
 * @property sendStreamResponse - The callback to send chunks of the response to,
 * if not provided, the response will be returned without streaming and ill not send partial responses text to frontend
 * @property updateStatus - The callback to update the status if the model is using tools,
 * if not provided, the status will not be updated at frontend
 * @property selectedModelName - The name of the selected model,
 * if provided, the model will use the selected model name to get the response,
 *
 * if not provided, the status will not be updated at frontend
 */
type GetResponseOptions = {
  query: string;
  historyManager: HistoryManager;
  images?: string[];
  currentEntryID?: string;
  sendStreamResponse?: (message: string) => void;
  updateStatus?: (status: string) => void;
  selectedModelName?: string;
};

export type LanguageModelService = {
  /**
   * Update the available models
   * @param newAvailableModels - The new available models
   */
  updateAvailableModels: (newAvailableModels: string[]) => void;

  /**
   * Get the latest version of the language model service
   */
  getLatestAvailableModelNames: () => Promise<string[]>;

  /**
   * Switch to a different model
   * @param newModel - The name of the model to switch to
   */
  switchModel: (newModel: string) => void;

  /**
   * Get the response for a query with an image and also fire a view event to send the response in chunks.
   * If the currentEntryID is provided
   * @param options - The options to get a response for
   * @returns The response for the query
   * @see GetResponseOptions
   */
  getResponse: (options: GetResponseOptions) => Promise<string>;

  /**
   * Stop current response
   */
  stopResponse: () => void;
};
