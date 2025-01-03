import { ContextServiceApi } from './types';
import MentionService from '../../services/context/mentionService';

export const createContextServiceApi = (): ContextServiceApi => {
  return {
    getFilesOrDirectoriesList: async (query: string) => {
      return await MentionService.getFilesOrDirectoriesList(query);
    },
    getFileContexts: async (mentions: string[]) => {
      return await MentionService.getFileContexts(mentions);
    },
    getProblemsContext: async (mentions: string[]) => {
      return await MentionService.getProblemsContext(mentions);
    },
  };
};
