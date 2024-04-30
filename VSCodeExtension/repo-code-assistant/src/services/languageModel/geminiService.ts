import * as vscode from "vscode";

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content } from "@google/generative-ai";
import { ConversationEntry, ConversationHistory } from "../../types/conversationHistory";
import { AbstractLanguageModelService } from "./abstractLanguageModelService";
import SettingsManager from "../../api/settingsManager";

export class GeminiService extends AbstractLanguageModelService {
  private modelName: string = "gemini-1.5-pro-latest";
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  constructor(context: vscode.ExtensionContext, settingsManager: SettingsManager) {
    super(context, 'geminiConversationHistory.json', settingsManager);
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

  private generationConfig = {
    temperature: 1,
    topK: 0,
    topP: 0.95,
    maxOutputTokens: 8192,
  };

  private safetySettings = [
    {category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE},
    {category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE},
    {category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE},
    {category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE},
  ];

  protected processLoadedHistory(history: ConversationHistory): void {
    this.history = history;
  }

  private conversationHistoryToContent(history: ConversationEntry[]): Content[] {
    return history.map((entry) => {
      return {
        role: entry.role === 'AI' ? 'model' : 'user',
        parts: [{text: entry.message}],
      };
    });
  }

  public async getResponseForQuery(query: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({model: this.modelName});

    try {
      const chat = model.startChat({
        generationConfig: this.generationConfig,
        safetySettings: this.safetySettings,
        history: this.conversationHistoryToContent(this.history.entries),
      });

      const result = await chat.sendMessage(query);
      const responseText = result.response.text();

      // Update conversation history
      this.history.entries.push({role: 'user', message: query});
      this.history.entries.push({role: 'AI', message: responseText});
      await this.saveHistory(this.history);

      return responseText;
    } catch (error) {
      vscode.window.showErrorMessage('Failed to get response from Gemini Service: ' + error);
      return "Failed to connect to the language model service.";
    }
  }

  public getConversationHistory(): ConversationHistory {
    return this.history;
  }

  public clearConversationHistory(): void {
    this.history = {entries: []};
    this.saveHistory(this.history).catch(
      (error) => vscode.window.showErrorMessage('Failed to clear conversation history: ' + error)
    );
  }
}
