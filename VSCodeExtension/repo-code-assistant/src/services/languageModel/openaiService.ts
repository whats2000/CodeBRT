import * as vscode from "vscode";
import { OpenAI } from "openai";
import ChatCompletionMessageParam = OpenAI.Chat.Completions.ChatCompletionMessageParam;
import ChatCompletionCreateParamsNonStreaming = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;
import ChatCompletionCreateParamsStreaming = OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming;

import { ConversationEntry, ConversationHistory } from "../../types/conversationHistory";
import { AbstractLanguageModelService } from "./abstractLanguageModelService";
import SettingsManager from "../../api/settingsManager";

export class OpenAIService extends AbstractLanguageModelService {
  private apiKey: string;
  static availableModelName: string[] = ["gpt-3.5-turbo"];
  private readonly settingsListener: vscode.Disposable;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    super(
      context,
      "openAIConversationHistory.json",
      settingsManager,
      OpenAIService.availableModelName[0],
    );
    this.apiKey = settingsManager.get("openAiApiKey");

    // Initialize and load conversation history
    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        "Failed to initialize OpenAI Service: " + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("repo-code-assistant.openAiApiKey")) {
        this.apiKey = settingsManager.get("openAiApiKey");
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistories();
    } catch (error) {
      vscode.window.showErrorMessage(
        "Failed to initialize OpenAI Service: " + error,
      );
    }
  }

  protected processLoadedHistory(history: ConversationHistory): void {
    this.history = history;
  }

  private conversationHistoryToContent(entries: { [key: string]: ConversationEntry }): ChatCompletionMessageParam[] {
    const result: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    let currentEntry = entries[this.history.current];

    while (currentEntry) {
      result.unshift({
        role: currentEntry.role === "user" ? "user" : "assistant",
        content: currentEntry.message,
      });

      if (currentEntry.parent) {
        currentEntry = entries[currentEntry.parent];
      } else {
        break;
      }
    }

    return result;
  }

  public async getResponseForQuery(query: string, currentEntryID?: string): Promise<string> {
    const openai = new OpenAI({
      apiKey: this.apiKey,
    });

    const history = currentEntryID ? this.getHistoryBeforeEntry(currentEntryID) : this.history;
    const conversationHistory = this.conversationHistoryToContent(history.entries);

    // Append the current query to the conversation history
    conversationHistory.push({ role: "user", content: query });

    try {
      const chatCompletion = await openai.chat.completions.create({
        messages: conversationHistory,
        model: OpenAIService.availableModelName[0],
      } as ChatCompletionCreateParamsNonStreaming);

      return chatCompletion.choices[0]?.message?.content!;
    } catch (error) {
      vscode.window.showErrorMessage(
        "Failed to get response from OpenAI Service: " + error,
      );
      return "Failed to connect to the language model service.";
    }
  }

  public async getResponseChunksForQuery(
    query: string,
    sendStreamResponse: (msg: string) => void,
    currentEntryID?: string,
  ): Promise<string> {
    const openai = new OpenAI({
      apiKey: this.apiKey,
    });

    const history = currentEntryID ? this.getHistoryBeforeEntry(currentEntryID) : this.history;
    const conversationHistory = this.conversationHistoryToContent(history.entries);

    // Append the current query to the conversation history
    conversationHistory.push({ role: "user", content: query });

    try {
      const stream = await openai.chat.completions.create({
        messages: conversationHistory,
        model: OpenAIService.availableModelName[0],
        stream: true,
      } as ChatCompletionCreateParamsStreaming);

      let responseText: string = "";

      // Update streaming response
      for await (const chunk of stream) {
        const partText = chunk.choices[0]?.delta?.content || "";
        sendStreamResponse(partText);
        responseText += partText;
      }

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        "Failed to get response from OpenAI Service: " + error,
      );
      return "Failed to connect to the language model service.";
    }
  }
}
