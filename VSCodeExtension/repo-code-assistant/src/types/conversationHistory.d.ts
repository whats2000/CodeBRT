export type ConversationEntry = {
  id: string;
  role: 'user' | 'AI';
  message: string;
  parent: string | null;
  children: string[];
}

export type ConversationHistory = {
  title: string;
  create_time: number;
  update_time: number;
  root: string;
  current: string;
  entries: { [key: string]: ConversationEntry };
}
