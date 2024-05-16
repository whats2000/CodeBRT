import * as vscode from "vscode";
import { Content, GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

import { ConversationEntry, ConversationHistory } from "../../types/conversationHistory";
import { AbstractLanguageModelService } from "./abstractLanguageModelService";
import SettingsManager from "../../api/settingsManager";

export class GeminiService extends AbstractLanguageModelService {
  static aviaryModelName: string[] = ["gemini-1.5-pro-latest"];
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  private readonly generationConfig = {
    temperature: 1,
    topK: 0,
    topP: 0.95,
    maxOutputTokens: 8192,
  };

  private readonly safetySettings = [
    {category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE},
    {category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE},
    {category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE},
    {category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE},
  ];

  constructor(context: vscode.ExtensionContext, settingsManager: SettingsManager) {
    super(context, 'geminiConversationHistory.json', settingsManager, GeminiService.aviaryModelName[0]);
    this.apiKey = settingsManager.get('geminiApiKey');
    this.initialize().catch((error) => vscode.window.showErrorMessage('Failed to initialize Gemini Service: ' + error));

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('repo-code-assistant.geminiApiKey')) {
        this.apiKey = settingsManager.get('geminiApiKey');
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistory();
    } catch (error) {
      vscode.window.showErrorMessage('Failed to initialize Gemini Service: ' + error);
    }
  }

  protected processLoadedHistory(history: ConversationHistory): void {
    this.history = history;
  }

  private conversationHistoryToContent(entries: { [key: string]: ConversationEntry }): Content[] {
    return Object.values(entries).map((entry) => ({
      role: entry.role === 'AI' ? 'model' : 'user',
      parts: [{ text: entry.message }],
    }));
  }

  public async getResponseForQuery(query: string, currentEntryID?: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: this.currentModel });

    const history = currentEntryID ? this.getHistoryBeforeEntry(currentEntryID) : this.history;

    try {
      const chat = model.startChat({
        generationConfig: this.generationConfig,
        safetySettings: this.safetySettings,
        history: this.conversationHistoryToContent(history.entries),
      });

      const result = await chat.sendMessage(query);
      return result.response.text();
    } catch (error) {
      vscode.window.showErrorMessage('Failed to get response from Gemini Service: ' + error);
      return "Failed to connect to the language model service.";
    }
  }

  public async getResponseChunksForQuery(query: string, sendStreamResponse: (msg: string) => void, currentEntryID?: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: this.currentModel });

    const history = currentEntryID ? this.getHistoryBeforeEntry(currentEntryID) : this.history;

    try {
      const chat = model.startChat({
        generationConfig: this.generationConfig,
        safetySettings: this.safetySettings,
        history: this.conversationHistoryToContent(history.entries),
      });

      let responseText = '';
      const result = await chat.sendMessageStream(query);
      for await (const item of result.stream) {
        const partText = item.text();
        sendStreamResponse(partText);
        responseText += partText;
      }

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage('Failed to get response from Gemini Service: ' + error);
      return "Failed to connect to the language model service.";
    }
  }
}
