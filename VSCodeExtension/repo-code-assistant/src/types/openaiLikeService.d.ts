import type {
  ChatCompletionContentPartImage as ChatCompletionContentPartImageOpenai,
  ChatCompletionCreateParamsBase as ChatCompletionCreateParamsBaseOpenai,
  ChatCompletionMessageParam as ChatCompletionMessageParamOpenai,
  ChatCompletionMessageToolCall as ChatCompletionMessageToolCallOpenai,
  ChatCompletionTool as ChatCompletionToolOpenai,
  ChatCompletionToolMessageParam as ChatCompletionToolMessageParamOpenai,
} from 'openai/resources/chat/completions';
import type {
  ChatCompletionContentPartImage as ChatCompletionContentPartImageGroq,
  ChatCompletionCreateParamsBase as ChatCompletionCreateParamsBaseGroq,
  ChatCompletionMessageParam as ChatCompletionMessageParamGroq,
  ChatCompletionMessageToolCall as ChatCompletionMessageToolCallGroq,
  ChatCompletionTool as ChatCompletionToolGroq,
  ChatCompletionToolMessageParam as ChatCompletionToolMessageParamGroq,
} from 'groq-sdk/resources/chat/completions';

export type ChatCompletionContentPartImageOpenaiLike =
  | ChatCompletionContentPartImageOpenai
  | ChatCompletionContentPartImageGroq;
export type ChatCompletionCreateParamsBaseOpenaiLike =
  | ChatCompletionCreateParamsBaseOpenai
  | ChatCompletionCreateParamsBaseGroq;
export type ChatCompletionMessageParamOpenaiLike =
  | ChatCompletionMessageParamOpenai
  | ChatCompletionMessageParamGroq;
export type ChatCompletionMessageToolCallOpenaiLike =
  | ChatCompletionMessageToolCallOpenai
  | ChatCompletionMessageToolCallGroq;
export type ChatCompletionToolOpenaiLike =
  | ChatCompletionToolOpenai
  | ChatCompletionToolGroq;
export type ChatCompletionToolMessageParamOpenaiLike =
  | ChatCompletionToolMessageParamOpenai
  | ChatCompletionToolMessageParamGroq;
