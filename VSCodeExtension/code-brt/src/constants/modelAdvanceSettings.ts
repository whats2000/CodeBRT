import { ConversationModelAdvanceSettings } from '../types';

export const MODEL_ADVANCE_SETTINGS: {
  [key in keyof ConversationModelAdvanceSettings]: {
    description: string;
    range: {
      min: number | undefined;
      max: number | undefined;
    };
    link?: string;
    notice?: string;
  };
} = {
  systemPrompt: {
    description:
      `The system prompt for the model. ` +
      `This can be used to introduce context to the model, ` +
      `such as a description of the conversation so far. ` +
      `Or, you can make the model more professional or casual by changing the prompt.`,
    range: {
      min: undefined,
      max: undefined,
    },
    link: 'https://platform.openai.com/docs/guides/prompt-engineering',
  },
  maxTokens: {
    description:
      `The maximum number of [tokens](/tokenizer) that can be generated in the chat completion. ` +
      `The total length of input tokens and generated tokens is limited by the model's context length.`,
    range: {
      min: 1,
      max: undefined,
    },
  },
  temperature: {
    description:
      `What sampling temperature to use, between 0 and 2. ` +
      `Higher values like 0.8 will make the output more random, ` +
      `while lower values like 0.2 will make it more focused and deterministic. ` +
      `We generally recommend altering this or \`top_p\` or \`top_k\` but not more than one.`,
    link: 'https://huggingface.co/blog/how-to-generate',
    range: {
      min: 0,
      max: 2,
    },
  },
  topP: {
    description:
      `An alternative to sampling with temperature, called nucleus sampling, ` +
      `where the model considers the results of the tokens with top_p probability mass. ` +
      `So 0.1 means only the tokens comprising the top 10% probability mass are considered.` +
      `We generally recommend altering this or \`temperature\` or \`top_k\` but not more than one.`,
    link: 'https://huggingface.co/blog/how-to-generate',
    range: {
      min: 0,
      max: 1,
    },
  },
  topK: {
    description:
      `An alternative to sampling with temperature, called top-k sampling, ` +
      `where the model considers the results of the top k most likely tokens. ` +
      `So 2 means that only the top 2 most likely tokens are considered. ` +
      `We generally recommend altering this or \`temperature\` or \`top_p\` but not more than one.`,
    notice: `Some models may not support top-k sampling.`,
    range: {
      min: 1,
      max: undefined,
    },
    link: 'https://huggingface.co/blog/how-to-generate',
  },
  presencePenalty: {
    description:
      `Number between -2.0 and 2.0. ` +
      `Positive values penalize new tokens based on whether they appear in the text so far, ` +
      `increasing the model's likelihood to talk about new topics.`,
    range: {
      min: -2,
      max: 2,
    },
    link: 'https://platform.openai.com/docs/guides/text-generation/parameter-details',
  },
  frequencyPenalty: {
    description:
      `Number between -2.0 and 2.0. ` +
      `Positive values penalize new tokens based on their existing frequency in the text so far, ` +
      `decreasing the model's likelihood to repeat the same line verbatim.`,
    range: {
      min: -2,
      max: 2,
    },
    link: 'https://platform.openai.com/docs/guides/text-generation/parameter-details',
  },
};
