export type ContextServiceApi = {
  getFilesOrDirectoriesList: (query: string) => Promise<string[]>;
};
