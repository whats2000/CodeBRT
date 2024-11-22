export type DiffControllerOptions = {
  /**
   * Custom temporary path for storing diff files
   */
  tempDiffPath?: string;

  /**
   * Whether to automatically clean up temporary diff files
   */
  autoCleanup?: boolean;
};

export type DiffResult = {
  /**
   * Indicates if there are any differences
   */
  hasDifferences: boolean;

  /**
   * Detailed diff information
   */
  diffDetails?: {
    added: number;
    removed: number;
    modified: number;
  };
};
