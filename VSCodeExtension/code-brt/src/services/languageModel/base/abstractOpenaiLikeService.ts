import vscode from 'vscode';

import {
  ChatCompletionChunkChoiceDeltaToolCallOpenaiLike,
  ChatCompletionContentPartImageOpenaiLike,
  ChatCompletionCreateParamsBaseOpenaiLike,
  ChatCompletionMessageParamOpenaiLike,
  ChatCompletionMessageToolCallOpenaiLike,
  ChatCompletionToolOpenaiLike,
  ConversationEntry,
  NonStreamCompletionOpenaiLike,
  NonWorkspaceToolType,
  ResponseWithAction,
  StreamCompletionOpenaiLike,
  ToolCallEntry,
  ToolCallResponse,
} from '../../../types';
import { HistoryManager } from '../../../api';
import { AbstractLanguageModelService } from './abstractLanguageModelService';
import { ToolServiceProvider } from '../../tools';
import { fileToBase64 } from '../utils';

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
        stop: advanceSettings.stop,
      },
    };
  }

  protected getEnabledTools(): ChatCompletionToolOpenaiLike[] | undefined {
    const enabledTools = this.settingsManager.get('enableTools');
    const tools: ChatCompletionToolOpenaiLike[] = [];
    const { agentTools, ...toolsSchema } = ToolServiceProvider.getToolSchema();

    if (enabledTools.agentTools?.active && agentTools) {
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
      if (!enabledTools[key as NonWorkspaceToolType]?.active) {
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

  private async fileToContentPartImage(
    filePath: string,
  ): Promise<ChatCompletionContentPartImageOpenaiLike | undefined> {
    try {
      const result = await fileToBase64(filePath);

      if (!result) {
        return undefined;
      }

      const { base64Data, mimeType } = result;
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
  ): Record<string, unknown> | undefined {
    try {
      return JSON.parse(argumentsString);
    } catch (error) {
      console.error('Failed to parse tool call arguments:', error);
      return undefined;
    }
  }

  protected async handleStreamResponse(
    responseText: string,
    streamResponse: StreamCompletionOpenaiLike,
    sendStreamResponse: (text: string) => void,
    updateStatus?: (status: string) => void,
  ): Promise<{
    responseText: string;
    responseToolCall?: ChatCompletionMessageToolCallOpenaiLike;
  }> {
    const completeToolCalls: (ChatCompletionMessageToolCallOpenaiLike & {
      index: number;
    })[] = [];

    for await (const chunk of streamResponse) {
      if (this.stopStreamFlag) {
        return { responseText: responseText };
      }

      if (chunk.choices[0]?.finish_reason === 'tool_calls') {
        return {
          responseText: responseText,
          responseToolCall: completeToolCalls[0],
        };
      }

      if (!chunk.choices[0]?.delta.tool_calls) {
        const partText = chunk.choices[0]?.delta?.content || '';
        sendStreamResponse(partText);
        responseText += partText;
        continue;
      }

      updateStatus && updateStatus(`[processing] I'm creating an action...`);

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

    return { responseText: responseText };
  }

  protected async conversationHistoryToContent(
    entries: { [key: string]: ConversationEntry },
    query: string,
    historyManager: HistoryManager,
    currentEntryID?: string,
    images?: string[],
    toolCallResponse?: ToolCallResponse,
  ): Promise<ChatCompletionMessageParamOpenaiLike[]> {
    const result: ChatCompletionMessageParamOpenaiLike[] = [];
    let currentEntry =
      entries[currentEntryID ?? historyManager.getCurrentHistory().current];

    while (currentEntry) {
      switch (currentEntry.role) {
        case 'AI':
          const newEntry: ChatCompletionMessageParamOpenaiLike = {
            role: 'assistant',
            content: currentEntry.message,
          };
          const toolCall = currentEntry.toolCalls?.[0];
          if (toolCall) {
            newEntry.tool_calls = [
              {
                id: toolCall.id,
                type: 'function',
                function: {
                  name: toolCall.toolName,
                  arguments: JSON.stringify(toolCall.parameters),
                },
              },
            ];
          }
          result.unshift(newEntry);
          break;
        case 'user':
          result.unshift({
            role: 'user',
            content: [{ type: 'text', text: currentEntry.message }],
          });
          break;
        case 'tool':
          const toolCallResponse = currentEntry.toolResponses?.[0];
          if (!toolCallResponse) {
            throw new Error('Tool call response not found');
          }
          result.unshift({
            role: 'tool',
            tool_call_id: toolCallResponse.id,
            content: JSON.stringify({
              error: toolCallResponse.status !== 'success',
              result: toolCallResponse.result,
            }),
          });
          break;
      }

      if (currentEntry.parent) {
        currentEntry = entries[currentEntry.parent];
      } else {
        break;
      }
    }

    // OpenAI like APIs require the query message at the end of the history
    if (
      result[result.length - 1]?.role !== 'user' &&
      result[result.length - 1]?.role !== 'tool'
    ) {
      if (toolCallResponse) {
        result.push({
          role: 'tool',
          tool_call_id: toolCallResponse.id,
          content: JSON.stringify({
            error: false,
            result: toolCallResponse.result,
          }),
        });
      } else {
        result.push({
          role: 'user',
          content: [{ type: 'text', text: query }],
        });
      }
    }

    if (images && images.length > 0) {
      const imageParts = (await Promise.all(
        images.map(async (image) => {
          return await this.fileToContentPartImage(image);
        }),
      ).then((parts) =>
        parts.filter((part) => part !== undefined),
      )) as ChatCompletionContentPartImageOpenaiLike[];

      if (result[result.length - 1]?.role === 'user') {
        result[result.length - 1] = {
          role: 'user',
          content: [{ type: 'text', text: query }, ...imageParts],
        };
      } else if (result[result.length - 1]?.role === 'tool') {
        // So as the tool response doesn't support images, we add the images as a separate model and user message
        result.push({
          role: 'assistant',
          content: 'Please provide the follow-up tool response image.',
        });
        result.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Now analyze the image which was a result of the previous tool call',
            },
            ...imageParts,
          ],
        });
      }
    }

    return result;
  }

  protected async getResponseWithRetry(
    conversationHistory: ChatCompletionMessageParamOpenaiLike[],
    selectedModelName: string | undefined,
    disableTools: boolean | undefined,
    generationConfig: Partial<ChatCompletionCreateParamsBaseOpenaiLike>,
    sendStreamResponse: ((message: string) => void) | undefined,
    updateStatus?: (status: string) => void,
  ): Promise<ResponseWithAction> {
    const MAX_RETRIES = 5;
    let retryCount = 0;
    let responseText = '';
    let responseToolCall: ChatCompletionMessageToolCallOpenaiLike | undefined =
      undefined;

    while (retryCount < MAX_RETRIES) {
      responseToolCall = undefined;
      const requestPayload: ChatCompletionCreateParamsBaseOpenaiLike = {
        messages: conversationHistory,
        model: selectedModelName ?? this.currentModel,
        tools: disableTools ? undefined : this.getEnabledTools(),
        ...generationConfig,
      };

      if (!sendStreamResponse) {
        const response = await this.handleGetNonStreamResponse(requestPayload);
        responseText = response.choices[0]?.message?.content || '';
        responseToolCall = response.choices[0]?.message.tool_calls?.[0];
      } else {
        const streamResponse =
          await this.handleGetStreamResponse(requestPayload);
        const responseObject = await this.handleStreamResponse(
          responseText,
          streamResponse,
          sendStreamResponse,
          updateStatus,
        );

        responseText = responseObject.responseText;
        responseToolCall = responseObject.responseToolCall;
      }

      if (!responseToolCall) {
        return {
          textResponse: responseText,
        };
      }

      const parsedToolCallArguments = this.tryParseToolCallArguments(
        responseToolCall.function.arguments,
      );

      let validation = {
        isValid: false,
        feedback:
          'The tool call arguments are not valid JSON format. Please rewrite the tool call and try again.',
      };

      if (parsedToolCallArguments) {
        const toolCall: ToolCallEntry = {
          id: responseToolCall.id,
          toolName: responseToolCall.function.name,
          parameters: parsedToolCallArguments,
          create_time: Date.now(),
        };

        validation = ToolServiceProvider.isViableToolCall(toolCall);
        // Return the response if the tool call is valid
        if (validation.isValid) {
          return {
            textResponse: responseText,
            toolCall,
          };
        }
      }

      // Otherwise, add the tool call feedback to the conversation history and retry
      conversationHistory.push({
        role: 'assistant',
        tool_calls: [responseToolCall],
      });
      conversationHistory.push({
        role: 'tool',
        content: JSON.stringify({
          error: true,
          feedback: validation.feedback,
        }),
        tool_call_id: responseToolCall.id,
      });

      retryCount++;
    }
    return { textResponse: responseText };
  }

  protected abstract handleGetNonStreamResponse(
    requestPayload: ChatCompletionCreateParamsBaseOpenaiLike,
  ): Promise<NonStreamCompletionOpenaiLike>;

  protected abstract handleGetStreamResponse(
    requestPayload: ChatCompletionCreateParamsBaseOpenaiLike,
  ): Promise<StreamCompletionOpenaiLike>;
}
