export interface ConversationEntry {
  role: 'user' | 'AI';
  message: string;
}

export interface ConversationHistory {
  entries: ConversationEntry[];
}
