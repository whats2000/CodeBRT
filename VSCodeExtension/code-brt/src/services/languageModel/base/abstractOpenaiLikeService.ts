import path from 'path';
import fs from 'fs';

import {
  ChatCompletionChunkChoiceDeltaToolCallOpenaiLike,
  ChatCompletionContentPartImageOpenaiLike,
  ChatCompletionCreateParamsBaseOpenaiLike,
  ChatCompletionMessageParamOpenaiLike,
  ChatCompletionToolOpenaiLike,
  ConversationEntry,
  NonStreamCompletionOpenaiLike,
  NonWorkspaceToolType,
  ResponseWithAction,
  StreamCompletionOpenaiLike,
} from '../../../types';
import { HistoryManager } from '../../../api';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import { ToolServiceProvider } from '../../tools';
import vscode from 'vscode';
import type { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';

export abstract class AbstractOpenaiLikeService extends AbstractLanguageModelService {
  protected stopStreamFlag: boolean = false;

  protected getAdvanceSettings(historyManager: HistoryManager): {
    systemPrompt: string | undefined;
    generationConfig: Partial<ChatCompletionCreateParamsBaseOpenaiLike>;
  } {
    const advanceSettings = historyManager.getCurrentHistory().advanceSettings;

    if (!advanceSettings) {
      return {
        systemPrompt: undefined,
        generationConfig: {},
      };
    }

    if (advanceSettings.topK) {
      void vscode.window.showWarningMessage(
        'Top-k sampling is not supported by the OpenAI or Groq APIs, so the setting will be ignored.',
      );
    }

    return {
      systemPrompt:
        advanceSettings.systemPrompt.length > 0
          ? advanceSettings.systemPrompt
          : undefined,
      generationConfig: {
        max_tokens: advanceSettings.maxTokens,
        temperature: advanceSettings.temperature,
        top_p: advanceSettings.topP,
        presence_penalty: advanceSettings.presencePenalty,
        frequency_penalty: advanceSettings.frequencyPenalty,
      },
    };
  }

  protected getEnabledTools(): ChatCompletionToolOpenaiLike[] | undefined {
    const enabledTools = this.settingsManager.get('enableTools');
    const tools: ChatCompletionToolOpenaiLike[] = [];
    const { agentTools, ...toolsSchema } = ToolServiceProvider.getToolSchema();

    if (enabledTools.agentTools.active && agentTools) {
      for (const [_key, tool] of Object.entries(agentTools)) {
        tools.push({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
          },
        });
      }
    }

    for (const [key, tool] of Object.entries(toolsSchema)) {
      if (!enabledTools[key as NonWorkspaceToolType].active) {
        continue;
      }

      tools.push({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      });
    }

    return tools.length > 0 ? tools : undefined;
  }

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

  protected tryParseToolCallArguments(
    argumentsString: string,
  ): Record<string, unknown> {
    try {
      return JSON.parse(argumentsString);
    } catch (error) {
      console.error('Failed to parse tool call arguments:', error);
      return {};
    }
  }

  protected async handleNonStreamResponse(
    response: NonStreamCompletionOpenaiLike,
  ): Promise<ResponseWithAction> {
    if (!response.choices[0]?.message.tool_calls) {
      return {
        textResponse: response.choices[0]?.message?.content || '',
      };
    }

    const toolCalls = response.choices[0].message.tool_calls;

    return {
      textResponse: response.choices[0]?.message?.content || '',
      toolCall: {
        id: toolCalls[0].id,
        toolName: toolCalls[0].function.name,
        parameters: this.tryParseToolCallArguments(
          toolCalls[0].function.arguments,
        ),
        create_time: Date.now(),
      },
    };
  }

  protected async handleStreamResponse(
    streamResponse: StreamCompletionOpenaiLike,
    sendStreamResponse: (text: string) => void,
  ): Promise<ResponseWithAction> {
    let responseText = '';

    const completeToolCalls: (ChatCompletionMessageToolCall & {
      index: number;
    })[] = [];

    for await (const chunk of streamResponse) {
      if (this.stopStreamFlag) {
        return { textResponse: responseText };
      }

      if (chunk.choices[0]?.finish_reason === 'tool_calls') {
        return {
          textResponse: responseText,
          toolCall: {
            id: completeToolCalls[0].id,
            toolName: completeToolCalls[0].function.name,
            parameters: this.tryParseToolCallArguments(
              completeToolCalls[0].function.arguments,
            ),
            create_time: Date.now(),
          },
        };
      }

      if (!chunk.choices[0]?.delta.tool_calls) {
        const partText = chunk.choices[0]?.delta?.content || '';
        sendStreamResponse(partText);
        responseText += partText;
        continue;
      }

      chunk.choices[0].delta.tool_calls.forEach(
        (deltaToolCall: ChatCompletionChunkChoiceDeltaToolCallOpenaiLike) => {
          const index = deltaToolCall.index;
          let existingToolCall = completeToolCalls.find(
            (call) => call.index === index,
          );

          if (!existingToolCall) {
            existingToolCall = {
              id: '',
              function: { name: '', arguments: '' },
              type: 'function',
              index: index,
            };
            completeToolCalls.push(existingToolCall);
          }

          existingToolCall.id += deltaToolCall.id || '';
          existingToolCall.function.name =
            deltaToolCall.function?.name || existingToolCall.function.name;
          existingToolCall.function.arguments +=
            deltaToolCall.function?.arguments || '';
        },
      );
    }

    return { textResponse: responseText };
  }

  protected async conversationHistoryToContent(
    entries: { [key: string]: ConversationEntry },
    query: string,
    historyManager: HistoryManager,
    images?: string[],
  ): Promise<ChatCompletionMessageParamOpenaiLike[]> {
    const result: ChatCompletionMessageParamOpenaiLike[] = [];
    let currentEntry = entries[historyManager.getCurrentHistory().current];

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
    if (result[result.length - 1]?.role !== 'user') {
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
