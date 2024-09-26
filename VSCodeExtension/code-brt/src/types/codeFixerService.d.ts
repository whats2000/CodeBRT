/*
 * Represents the status of each code fixer operation.
 */
export type CodeFixerStatuses = {
  [key: string]: {
    status: 'waitForResponse' | 'receivedResponse' | 'error';
  };
};

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
  sendCodeFixerStatus?: (codeFixerStatuses: CodeFixerStatuses) => void;
};

export type CodeFixerResponse = {
  modifications: CodeFixerModification[];
  success: boolean;
  error?: string;
};

/*
 * Represents a code fixer response.
 */
export type CodeFixerModification = {
  startLine: number;
  endLine: number;
  content: string;
};

/*
 * Service for code fixer operations.
 */
export interface CodeFixerService {
  /**
   * Gets the response from the code fixer based on the provided options.
   * @param options The options to use for getting the code fixer response.
   * @returns A promise that resolves to a CodeFixerResponse containing the modifications.
   */
  getResponse(options: GetResponseCodeFixerOptions): Promise<CodeFixerResponse>;

  /**
   * Updates the status of the code fixer operation.
   * @param key The identifier for the operation.
   * @param status The status to update.
   */
  updateStatus(key: string, status: 'waitForResponse' | 'receivedResponse' | 'error'): void;

  /**
   * Updates the available models for the code fixer.
   * @param newAvailableModels An array of available model names to update.
   */
  updateAvailableModels(newAvailableModels: string[]): void;

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
   * Gets the latest available model names.
   * @returns A promise that resolves to an array of model names.
   */
  getLatestAvailableModelNames(): Promise<string[]>;
}
