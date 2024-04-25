import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content } from "@google/generative-ai";
import { ConversationEntry, ConversationHistory } from "../../types/conversationHistory";

export class GeminiService {
  private readonly apiKey: string;
  private modelName: string = "gemini-1.5-pro-latest";
  private readonly history: ConversationHistory = { entries: [] };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private generationConfig = {
    temperature: 1,
    topK: 0,
    topP: 0.95,
    maxOutputTokens: 8192,
  };

  private safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ];

  private conversationHistoryToContent(history: ConversationEntry[]): Content[] {
    return history.map((entry) => {
      return {
        role: entry.role,
        parts: [{ text: entry.message }],
      };
    });
  }

  public async getResponseForQuery(query: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: this.modelName });

    try {
      const chat = model.startChat({
        generationConfig: this.generationConfig,
        safetySettings: this.safetySettings,
        history: this.conversationHistoryToContent(this.history.entries),
      });

      const result = await chat.sendMessage(query);
      const responseText = result.response.text();

      // Update conversation history
      this.history.entries.push({ role: 'user', message: query });
      this.history.entries.push({ role: 'AI', message: responseText });

      return responseText;
    } catch (error) {
      console.error('An error occurred:', error);
      return "Failed to connect to the language model service.";
    }
  }

  public getConversationHistory(): ConversationHistory {
    return this.history;
  }
}
