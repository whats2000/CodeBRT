import { ConversationModelAdvanceSettings } from '../types';

export const MODEL_ADVANCE_SETTINGS: {
  [key in keyof ConversationModelAdvanceSettings]: {
    range: {
      min: number | undefined;
      max: number | undefined;
    };
    link?: string;
  };
} = {
  systemPrompt: {
    range: {
      min: undefined,
      max: undefined,
    },
    link: 'https://platform.openai.com/docs/guides/prompt-engineering',
  },
  maxTokens: {
    range: {
      min: 1,
      max: undefined,
    },
  },
  temperature: {
    link: 'https://huggingface.co/blog/how-to-generate',
    range: {
      min: 0,
      max: 2,
    },
  },
  topP: {
    link: 'https://huggingface.co/blog/how-to-generate',
    range: {
      min: 0,
      max: 1,
    },
  },
  topK: {
    range: {
      min: 1,
      max: 500,
    },
    link: 'https://huggingface.co/blog/how-to-generate',
  },
  presencePenalty: {
    range: {
      min: -2,
      max: 2,
    },
    link: 'https://platform.openai.com/docs/guides/text-generation/parameter-details',
  },
  frequencyPenalty: {
    range: {
      min: -2,
      max: 2,
    },
    link: 'https://platform.openai.com/docs/guides/text-generation/parameter-details',
  },
  stop: {
    range: {
      min: undefined,
      max: undefined,
    },
    link: 'https://platform.openai.com/docs/api-reference/chat/create#chat-create-stop',
  },
};
