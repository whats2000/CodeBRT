import { Stream as StreamOpenai } from 'openai/streaming';
import { Stream as StreamGroq } from 'groq-sdk/streaming';
import type OpenAI from 'openai';
import type Groq from 'groq-sdk';

export type ChatCompletionContentPartImageOpenaiLike =
  | OpenAI.Chat.Completions.ChatCompletionContentPartImage
  | Groq.Chat.Completions.ChatCompletionContentPartImage;
export type ChatCompletionCreateParamsBaseOpenaiLike =
  | OpenAI.Chat.Completions.ChatCompletionCreateParams
  | Groq.Chat.Completions.ChatCompletionCreateParams;
export type ChatCompletionMessageParamOpenaiLike =
  | OpenAI.Chat.Completions.ChatCompletionMessageParam
  | Groq.Chat.Completions.ChatCompletionMessageParam;
export type ChatCompletionToolOpenaiLike =
  | OpenAI.Chat.Completions.ChatCompletionTool
  | Groq.Chat.Completions.ChatCompletionTool;
export type StreamCompletionOpenaiLike =
  | StreamOpenai<OpenAI.Chat.Completions.ChatCompletionChunk>
  | StreamGroq<Groq.Chat.Completions.ChatCompletionChunk>;
export type NonStreamCompletionOpenaiLike =
  | OpenAI.Chat.Completions.ChatCompletion
  | Groq.Chat.Completions.ChatCompletion;
export type ChatCompletionMessageToolCallOpenaiLike =
  | OpenAI.Chat.ChatCompletionMessageToolCall
  | Groq.Chat.ChatCompletionMessageToolCall;
export type ChatCompletionChunkChoiceDeltaToolCallOpenaiLike =
  | OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall
  | Groq.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall;
