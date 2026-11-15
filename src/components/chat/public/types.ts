export interface ChatMessage {
  id: string;
  direction: 'IN' | 'OUT';
  content: string;
  createdAt: string;
}

export interface MessageGroup {
  dayKey: string;
  dayLabel: string;
  messages: ChatMessage[];
}

export interface ActiveChatData {
  status: 'active';
  id: string;
  organization: { name: string };
  contactName: string | null;
  messages: ChatMessage[];
}

export interface BlockedChatData {
  status: 'blocked';
  organizationName: string;
  contactFirstName: string | null;
}

export interface ClosedChatData {
  status: 'closed';
  organizationName: string;
  contactFirstName: string | null;
}

export interface ExpiredChatData {
  status: 'expired';
  organizationName: string;
}

export interface NotFoundChatData {
  status: 'not_found';
}

export type ChatState =
  | ActiveChatData
  | BlockedChatData
  | ClosedChatData
  | ExpiredChatData
  | NotFoundChatData;

// Для удобства в компонентах:
export type NonActiveChatData = Exclude<ChatState, ActiveChatData>;