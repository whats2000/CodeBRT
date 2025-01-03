export type ContextServiceApi = {
  /**
   * Get the list of files or directories based on the query
   * @param query - The query to filter the files or directories
   */
  getFilesOrDirectoriesList: (query: string) => Promise<string[]>;

  /**
   * Get the contexts of multiple files or directories.
   * @param mentionPaths - The relative path of the file or directory
   */
  getFileContexts: (mention: string[]) => Promise<string>;

  /**
   * Get the context of problem mentions.
   * @param mentions - The mentions to get the context for
   */
  getProblemsContext: (mentions: string[]) => Promise<string>;
};
