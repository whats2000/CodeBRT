import * as vscode from "vscode";
import { OpenAI } from "openai";
import { ConversationHistory } from "../../types/conversationHistory";
import { AbstractLanguageModelService } from "./abstractLanguageModelService";
import SettingsManager from "../../api/settingsManager";

export class OpenAIService extends AbstractLanguageModelService {
  private apiKey: string;
  static aviaryModelName: string = "gpt-3.5-turbo";
  private readonly settingsListener: vscode.Disposable;
  // private readonly historyLimit: number = 100;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    super(
      context,
      "openAIConversationHistory.json",
      settingsManager,
      OpenAIService.aviaryModelName[0],
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
      if (e.affectsConfiguration("repo-code-assistant.openAIApiKey")) {
        this.apiKey = settingsManager.get("openAiApiKey");
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistory();
    } catch (error) {
      vscode.window.showErrorMessage(
        "Failed to initialize OpenAI Service: " + error,
      );
    }
  }

  protected processLoadedHistory(history: ConversationHistory): void {
    this.history = history;
  }

  public async getResponseForQuery(query: string): Promise<string> {
    const openai = new OpenAI({
      apiKey: this.apiKey,
    });
    try {
      const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: "user", content: query }],
        model: OpenAIService.aviaryModelName,
      });

      const responseText: string = chatCompletion.choices[0]?.message?.content!;

      // Update conversation history
      this.addConversationEntry(null, "user", responseText);

      return responseText;
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
    try {
      const stream = await openai.chat.completions.create({
        messages: [{ role: "user", content: query }],
        model: OpenAIService.aviaryModelName,
        stream: true,
      });

      let responseText: string = "";
      // update streamming response
      for await (const chunk of stream) {
        const partText = chunk.choices[0]?.delta?.content || "";
        sendStreamResponse(partText);
        responseText += partText;
      }

      // Update conversation history
      this.addConversationEntry(null, "user", responseText);

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage(
        "Failed to get response from OpenAI Service: " + error,
      );
      return "Failed to connect to the language model service.";
    }
  }
}
