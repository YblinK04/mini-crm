
import type { ChannelAdapter, IncomingMessage } from '../types';
import { getSettings } from '@/lib/settings';
import * as tg from './client';

type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TgUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    date: number;
    chat: { id: number; type: string; username?: string };
    from?: TgUser;
    text?: string;
  };
};

const WEBHOOK_SECRET_HEADER = 'x-telegram-bot-api-secret-token';

function buildDisplayName(from: TgUser | undefined): string | undefined {
  if (!from) return undefined;
  const parts = [from.first_name, from.last_name].filter(
    (s): s is string => typeof s === 'string' && s.length > 0,
  );
  return parts.length > 0 ? parts.join(' ') : undefined;
}

export class TelegramAdapter implements ChannelAdapter {
  readonly channel = 'TELEGRAM' as const;

  async parseWebhook(
    body: unknown,
    headers: Headers,
  ): Promise<IncomingMessage | null> {
    const settings = await getSettings();
    const expected = settings?.telegramWebhookSecret;

    if (!expected) {
      throw new Error('[telegram] Webhook secret is not configured');
    }

    const provided = headers.get(WEBHOOK_SECRET_HEADER);
    if (!provided || provided !== expected) {
      return null;
    }

    if (!body || typeof body !== 'object') return null;

    const update = body as TgUpdate;
    const m = update.message;
    if (!m) return null;
    if (!m.text) return null;
    if (m.chat.type !== 'private') return null;

    return {
      channel: this.channel,
      externalChatId: String(m.chat.id),
      externalMessageId: String(m.message_id),
      text: m.text,
      displayName: buildDisplayName(m.from),
      username: m.from?.username,
      rawPayload: body,
    };
  }

  async sendMessage(
    externalChatId: string,
    text: string,
  ): Promise<{ externalId: string }> {
    const settings = await getSettings();
    if (!settings?.telegramBotToken) {
      throw new Error('[telegram] Bot token is not configured');
    }

    const result = await tg.sendMessage(
      settings.telegramBotToken,
      externalChatId,
      text,
    );

    return { externalId: String(result.message_id) };
  }
}