import * as vscode from "vscode";
import { Cohere, CohereClient } from "cohere-ai";

import { ConversationEntry, ConversationHistory } from "../../types/conversationHistory";
import { AbstractLanguageModelService } from "./abstractLanguageModelService";
import SettingsManager from "../../api/settingsManager";

export class CohereService extends AbstractLanguageModelService {
  static aviaryModelName: string[] = ["command"];
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    super(context, "cohereConversationHistory.json", settingsManager, CohereService.aviaryModelName[0]);
    this.apiKey = settingsManager.get("cohereApiKey");
    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        "Failed to initialize Cohere Service: " + error,
      ),
    );

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("repo-code-assistant.cohereApiKey")) {
        this.apiKey = settingsManager.get("cohereApiKey");
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
    entries: { [key: string]: ConversationEntry },
  ): Cohere.ChatMessage[] {
    return Object.values(entries).map((entry) => {
      return {
        role: entry.role === "AI" ? "CHATBOT" : "USER",
        message: entry.message,
      };
    });
  }

  public async getResponseForQuery(query: string, currentEntryID?: string): Promise<string> {
    const model = new CohereClient({ token: this.apiKey });

    const history = currentEntryID ? this.getHistoryBeforeEntry(currentEntryID) : this.history;

    try {
      const response = await model.chat({
        chatHistory: this.conversationHistoryToContent(history.entries),
        model: this.currentModel,
        message: query,
      });

      return response.text;
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
    currentEntryID?: string,
  ): Promise<string> {
    const model = new CohereClient({
      token: this.apiKey,
    });

    const history = currentEntryID ? this.getHistoryBeforeEntry(currentEntryID) : this.history;

    try {
      const result = await model.chatStream({
        chatHistory: this.conversationHistoryToContent(history.entries),
        model: this.currentModel,
        message: query,
      });
      let responseText = "";
      for await (const item of result) {
        if (item.eventType !== "text-generation") continue;

        const partText = item.text;
        sendStreamResponse(partText);
        responseText += partText;
      }

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        "Failed to get response from Cohere Service: " + error,
      );
      return "Failed to connect to the language model service.";
    }
  }
}
