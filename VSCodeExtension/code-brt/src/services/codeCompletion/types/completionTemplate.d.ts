import { ConversationModelAdvanceSettings } from '../../../types';

export type CompletionTemplate = {
  template:
    | string
    | ((
        prefix: string,
        suffix: string,
        filepath: string,
        language: string,
      ) => string);
  completionOptions?: Partial<
    Omit<ConversationModelAdvanceSettings, 'systemPrompt'>
  >;
};
