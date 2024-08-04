import path from 'path';
import fs from 'fs';

import type {
  ChatCompletionContentPartImageOpenaiLike,
  ChatCompletionCreateParamsBaseOpenaiLike,
  ChatCompletionMessageParamOpenaiLike,
  ChatCompletionMessageToolCallOpenaiLike,
  ChatCompletionToolMessageParamOpenaiLike,
  ChatCompletionToolOpenaiLike,
  ConversationEntry,
  ToolServiceType,
} from '../../types';
import { toolsSchema } from '../../constants';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import { ToolService } from '../tools';

export abstract class AbstractOpenaiLikeService extends AbstractLanguageModelService {
  protected readonly generationConfig: Partial<ChatCompletionCreateParamsBaseOpenaiLike> =
    {
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 1,
      stop: null,
    };

  protected tools: ChatCompletionToolOpenaiLike[] = Object.keys(
    toolsSchema,
  ).map((toolKey) => {
    const tool = toolsSchema[toolKey as ToolServiceType];
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    };
  });

  private fileToGenerativePart(
    filePath: string,
    mimeType: string,
  ): ChatCompletionContentPartImageOpenaiLike | undefined {
    try {
      const base64Data = fs.readFileSync(filePath).toString('base64');
      return {
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${base64Data}`,
        },
      };
    } catch (error) {
      console.error('Failed to read image file:', error);
    }
  }

  protected handleFunctionCalls = async (
    functionCalls: ChatCompletionMessageToolCallOpenaiLike[],
    updateStatus?: (status: string) => void,
  ): Promise<ChatCompletionToolMessageParamOpenaiLike[]> => {
    const functionCallResults: ChatCompletionToolMessageParamOpenaiLike[] = [];

    for (const functionCall of functionCalls) {
      if (
        !functionCall.function?.name ||
        !functionCall.id ||
        !functionCall.function?.arguments
      ) {
        continue;
      }

      const tool = ToolService.getTool(functionCall.function.name);
      if (!tool) {
        functionCallResults.push({
          role: 'tool',
          tool_call_id: functionCall.id,
          content:
            'Failed to find tool with name: ' + functionCall.function.name,
        });
        continue;
      }

      try {
        const result = await tool({
          ...JSON.parse(functionCall.function.arguments),
          updateStatus,
        });
        functionCallResults.push({
          role: 'tool',
          tool_call_id: functionCall.id,
          content: result,
        });
      } catch (error) {
        functionCallResults.push({
          role: 'tool',
          tool_call_id: functionCall.id,
          content: `Error executing tool ${functionCall.function.name}: ${error}`,
        });
      }
    }

    return functionCallResults;
  };

  protected async conversationHistoryToContent(
    entries: { [key: string]: ConversationEntry },
    query: string,
    images?: string[],
  ): Promise<ChatCompletionMessageParamOpenaiLike[]> {
    const result: ChatCompletionMessageParamOpenaiLike[] = [];
    let currentEntry = entries[this.history.current];

    while (currentEntry) {
      const messageParam: ChatCompletionMessageParamOpenaiLike =
        currentEntry.role === 'user'
          ? {
              role: 'user',
              content: [{ type: 'text', text: currentEntry.message }],
            }
          : {
              role: 'assistant',
              content: currentEntry.message,
            };

      result.unshift(messageParam);

      if (currentEntry.parent) {
        currentEntry = entries[currentEntry.parent];
      } else {
        break;
      }
    }

    // OpenAI like APIs require the query message at the end of the history
    if (result.length > 0 && result[result.length - 1].role !== 'user') {
      result.push({
        role: 'user',
        content: [{ type: 'text', text: query }],
      });
    }

    if (images && images.length > 0) {
      const imageParts = images
        .map((image) => {
          const mimeType = `image/${path.extname(image).slice(1)}`;
          return this.fileToGenerativePart(image, mimeType);
        })
        .filter(
          (part) => part !== undefined,
        ) as ChatCompletionContentPartImageOpenaiLike[];

      result[result.length - 1] = {
        role: 'user',
        content: [{ type: 'text', text: query }, ...imageParts],
      };
    }

    return result;
  }
}
