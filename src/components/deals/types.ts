export interface ContactOption {
  id: string;
  firstName: string;
  lastName: string | null;
  telegramUsername: string | null;
}

export interface DealSavePayload {
  id: string;
  title: string;
  budget: number;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  customFields: Record<string, string>;
  contactIds?: string[];
}

export interface WebChatStatus {
  token: string | null;
  expiresAt: string | null;
  hasTelegramContact: boolean;
}