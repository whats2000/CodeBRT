/*
 * Options for getting a response from the CodeFixerService.
 * @property userQuery - The query string to process.
 * @property originalCode - The original code to process.
 * @property generatedCode - The generated code to process.
 * @property sendCodeFixerStatus - Callback function to update the status of the code fixer.
 */
export type GetResponseCodeFixerOptions = {
  userQuery: string;
  originalCode: string;
  generatedCode: string;
};

/*
 * Represents one of LLM responses in code fixer.
 */
export type CodeFixerModification = {
  startLine: number;
  endLine: number;
  content: string;
};

/**
 * Represents code fixer responses.
 */
export type CodeFixerResponse = {
  modifications: CodeFixerModification[];
  success: boolean;
  error?: string;
};


/*
 * Service for code fixer operations.
 */
export interface CodeFixerService {

  /**
   * Updates the available models for the code fixer.
   * @param newAvailableModels An array of available model names to update.
   */
  updateAvailableModels(newAvailableModels: string[]): void;

  /**
   * Gets the latest available model names.
   * @returns A promise that resolves to an array of model names.
   */
  getLatestAvailableModelNames(): Promise<string[]>;

  /**
   * Switch to a different model
   * @param newModel - The name of the model to switch to
   */
  switchModel: (newModel: string) => void;

  /**
   * Stops the current code fixer response.
   */
  stopResponse(): Promise<void>;


  /**
   * Gets the response from the code fixer based on the provided options.
   * @param options The options to use for getting the code fixer response.
   * @returns A promise that resolves to a CodeFixerResponse containing the modifications.
   */
  getResponse(options: GetResponseCodeFixerOptions): Promise<CodeFixerResponse>;
}