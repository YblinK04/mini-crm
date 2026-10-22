
export interface ChatMessage {
  id: string;
  direction: 'IN' | 'OUT';
  content: string;
  createdAt: string;
}

export interface ChatData {
  organization: { name: string };
  title: string;
  messages: ChatMessage[];
}

export interface MessageGroup {
  dayKey: string;
  dayLabel: string;
  messages: ChatMessage[];
}