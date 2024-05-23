import * as vscode from "vscode";
import Groq from "groq-sdk";
import ChatCompletionMessageParam = Groq.Chat.Completions.ChatCompletionMessageParam;
import {
  ConversationEntry,
  ConversationHistory,
} from "../../types/conversationHistory";
import { AbstractLanguageModelService } from "./abstractLanguageModelService";
import SettingsManager from "../../api/settingsManager";
import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
} from "groq-sdk/src/resources/chat/completions";

export class GroqService extends AbstractLanguageModelService {
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    availableModelName: string[] = [
      "llama3-70b-8192",
      "llama3-8b-8192",
      "mixtral-8x7b-32768",
      "gemma-7b-it",
    ],
  ) {
    super(
      context,
      "groqConversationHistory.json",
      settingsManager,
      availableModelName[0],
      availableModelName,
    );
    this.apiKey = settingsManager.get("groqApiKey");

    // Initialize and load conversation history
    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        "Failed to initialize Groq Service: " + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("repo-code-assistant.groqApiKey")) {
        this.apiKey = settingsManager.get("groqApiKey");
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistories();
    } catch (error) {
      vscode.window.showErrorMessage(
        "Failed to initialize Groq Service: " + error,
      );
    }
  }

  protected processLoadedHistory(history: ConversationHistory): void {
    this.history = history;
  }

  private conversationHistoryToContent(entries: {
    [key: string]: ConversationEntry;
  }): ChatCompletionMessageParam[] {
    const result: Groq.Chat.Completions.ChatCompletionMessageParam[] = [];
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

  public async getResponseForQuery(
    query: string,
    currentEntryID?: string,
  ): Promise<string> {
    const groq = new Groq({
      apiKey: this.apiKey,
    });

    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;
    const conversationHistory = this.conversationHistoryToContent(
      history.entries,
    );

    // Append the current query to the conversation history
    conversationHistory.push({ role: "user", content: query });

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: conversationHistory,
        model: this.currentModel,
        temperature: 0.5,
        max_tokens: 1024,
        top_p: 1,
        stop: null,
        stream: false,
      } as ChatCompletionCreateParamsNonStreaming);

      return chatCompletion.choices[0]?.message?.content!;
    } catch (error) {
      vscode.window.showErrorMessage(
        "Failed to get response from Groq Service: " + error,
      );
      return "Failed to connect to the language model service.";
    }
  }

  public async getResponseChunksForQuery(
    query: string,
    sendStreamResponse: (msg: string) => void,
    currentEntryID?: string,
  ): Promise<string> {
    const groq = new Groq({
      apiKey: this.apiKey,
    });

    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;
    const conversationHistory = this.conversationHistoryToContent(
      history.entries,
    );

    // Append the current query to the conversation history
    conversationHistory.push({ role: "user", content: query });

    try {
      const stream = await groq.chat.completions.create({
        messages: conversationHistory,
        model: this.currentModel,
        temperature: 0.5,
        max_tokens: 1024,
        top_p: 1,
        stop: null,
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
        "Failed to get response from Groq Service: " + error,
      );
      return "Failed to connect to the language model service.";
    }
  }
}
