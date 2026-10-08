
export type ChannelName = 'TELEGRAM' | 'MAX';

export interface IncomingMessage {
  channel: ChannelName;
  externalChatId: string;
  externalMessageId: string;
  text: string;
  displayName?: string;
  username?: string;

  attachments?: IncomingAttachment[];
  rawPayload: unknown;
}

export interface IncomingAttachment {
  type: 'photo' | 'document' | 'video' | 'audio';
  url?: string;
  fileId?: string;
  fileName?: string;
  mimeType?: string;
}

export interface ChannelAdapter {
  readonly channel: ChannelName;

  parseWebhook(
    body: unknown,
    headers: Headers,
  ): Promise<IncomingMessage | null> | IncomingMessage | null;

  sendMessage(
    externalChatId: string,
    text: string,
  ): Promise<{ externalId: string }>;
}