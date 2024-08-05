import type { ConversationHistory, ConversationHistoryIndex } from '../types';

export type IHistoryManager = {
  getCurrentHistory(): ConversationHistory;
  getHistoryBeforeEntry(currentEntryID?: string): ConversationHistory;
  addNewConversationHistory(): Promise<ConversationHistory>;
  addConversationEntry(
    parentID: string | null,
    role: 'user' | 'AI',
    message: string,
    images?: string[],
  ): Promise<string>;
  editConversationEntry(entryID: string, newMessage: string): Promise<void>;
  updateHistoryTitleById(historyID: string, newTitle: string): Promise<void>;
  switchHistory(historyID: string): Promise<void>;
  getHistories(): { [key: string]: ConversationHistoryIndex };
  deleteHistory(historyID: string): Promise<ConversationHistory>;
};
