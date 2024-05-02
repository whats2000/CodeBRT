import * as vscode from "vscode";
import { Cohere, CohereClient } from "cohere-ai";

import {
  ConversationEntry,
  ConversationHistory,
} from "../../types/conversationHistory";
import { AbstractLanguageModelService } from "./abstractLanguageModelService";
import SettingsManager from "../../api/settingsManager";

export class CohereService extends AbstractLanguageModelService {
  private modelName: string = "command";
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    super(context, "cohereConversationHistory.json", settingsManager);
    this.apiKey = settingsManager.get("geminiApiKey");
    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        "Failed to initialize Cohere Service: " + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("repo-code-assistant.geminiApiKey")) {
        this.apiKey = settingsManager.get("geminiApiKey");
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistory();
    } catch (error) {
      vscode.window.showErrorMessage(
        "Failed to initialize Cohere Service: " + error,
      );
    }
  }

  protected processLoadedHistory(history: ConversationHistory): void {
    this.history = history;
  }

  private conversationHistoryToContent(
    history: ConversationEntry[],
  ): Cohere.ChatMessage[] {
    return history.map((entry) => {
      return {
        role: entry.role === "AI" ? "CHATBOT" : "USER",
        message: entry.message,
      };
    });
  }

  public async getResponseForQuery(query: string): Promise<string> {
    const model = new CohereClient({ token: this.apiKey });

    try {
      const response = await model.chat({
        chatHistory: this.conversationHistoryToContent(this.history.entries),
        model: this.modelName,
        message: query,
      });

      const responseText = response.text;

      // Update conversation history
      this.history.entries.push({ role: "user", message: query });
      this.history.entries.push({ role: "AI", message: responseText });
      await this.saveHistory(this.history);

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        "Failed to get response from Cohere Service: " + error,
      );
      return "Failed to connect to the language model service.";
    }
  }

  public async getResponseChunksForQuery(
    query: string,
    sendStreamResponse: (msg: string) => void,
  ): Promise<string> {
    const model = new CohereClient({
      token: this.apiKey,
    });

    try {
      const result = await model.chatStream({
        chatHistory: this.conversationHistoryToContent(this.history.entries),
        model: this.modelName,
        message: query,
      });
      let responseText = "";
      for await (const item of result) {
        if (item.eventType !== "text-generation") continue;

        const partText = item.text;
        sendStreamResponse(partText);
        responseText += partText;
      }

      // Update conversation history
      this.history.entries.push({ role: "user", message: query });
      this.history.entries.push({ role: "AI", message: responseText });
      await this.saveHistory(this.history);

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        "Failed to get response from Cohere Service: " + error,
      );
      return "Failed to connect to the language model service.";
    }
  }
}
