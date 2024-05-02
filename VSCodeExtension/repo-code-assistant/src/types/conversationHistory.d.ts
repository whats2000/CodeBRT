export type ConversationEntry = {
  role: 'user' | 'AI';
  message: string;
}

export type ConversationHistory = {
  entries: ConversationEntry[];
}
