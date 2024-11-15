/**
 * Represents the modifications in the code.
 */
export type Modification = {
  startLine: number;
  endLine: number;
  content: string;
};

/**
 * Represents the response from the code fixer.
 */
export type FixCodeResponse = {
  success: boolean;
  modifications: Modification[];
  error?: string;
};

/**
 * Represents the options for the fixCode function.
 */
export type FixCodeOptions = {
  originalCode: string;
  generatedCode: string;
  userQuery: string;
};

export type CodeFixerApi = {
  /**
   * Insert code into the editor at the current cursor position.
   * @param code - The code to insert.
   */
  insertCode: (code: string) => Promise<void>;

  /**
   * Get the current editor code.
   * @returns The current code in the editor.
   */
  getCurrentEditorCode: () => Promise<string>;

  /**
   * Fix the code by comparing the original and generated code.
   * @param options - The options including the original and generated code.
   * @returns The result of the code fixing process.
   */
  fixCode: (options: FixCodeOptions) => Promise<FixCodeResponse>;

  /**
   * Apply the modifications to the code.
   * @param modifications - The modifications to apply.
   */
  applyDecorations: (modifications: Modification[]) => Promise<void>;

  /**
   * Insert the selected code to the chat input.
   */
  insertSelectedCodeToChat: () => void;

  /**
   * Revert the temporary insertions.
   */
  revertTemporaryInsertions: () => Promise<void>;

  /**
   * Get the current editor info.
   */
  getEditorInfo: () => void;

  /**
   * Show the full diff in the editor.
   * @param originalCode - The original code to show in the diff.
   * @param modifiedCode - The modified code to show in the diff.
   */
  showFullDiffInEditor: ({
    originalCode,
    modifiedCode,
  }: {
    originalCode: string;
    modifiedCode: string;
  }) => void;

  /**
   * Apply the modifications to the code.
   * @param modifications - The modifications to apply.
   */
  applyCodeChanges: (
    modifications: Modification[],
  ) => Promise<{ success: boolean; error?: string }>;

  /**
   * Close the active editor.
   */
  closeActiveEditor: () => Promise<void>;
};
