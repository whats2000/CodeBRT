import type { EditorApi } from './types';

export const createEditorApi = (): EditorApi => {
  return {
    insertPartialCode: async (_code: string, _relativePath: string) => {},
  };
};
