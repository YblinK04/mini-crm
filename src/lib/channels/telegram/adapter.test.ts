import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/settings', () => ({
  getSettings: vi.fn(),
  invalidateSettings: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

import { TelegramAdapter } from './adapter';
import { getSettings } from '@/lib/settings';

const TEST_SECRET = 'test-secret';
const SECRET_HEADER = 'x-telegram-bot-api-secret-token';

function makeUpdate(overrides: {
  messageId?: number;
  chatId?: number;
  chatType?: string;
  text?: string | null;
  firstName?: string;
  lastName?: string;
  username?: string;
} = {}): any {
  const {
    messageId = 1,
    chatId = 100500,
    chatType = 'private',
    text = 'Привет',
    firstName = 'Иван',
    lastName = 'Петров',
    username = 'ivan',
  } = overrides;

  return {
    update_id: 1,
    message: {
      message_id: messageId,
      chat: { id: chatId, type: chatType, username },
      from: { id: chatId, first_name: firstName, last_name: lastName, username },
      text: text ?? undefined,
    },
  };
}

function makeCallback(overrides: any = {}): any {
  return {
    update_id: 2,
    callback_query: {
      id: 'cb-123',
      data: 'welcome_ack',
      from: { id: 100500, first_name: 'Иван', username: 'ivan' },
      message: {
        message_id: 1,
        chat: { id: 100500, type: 'private' },
      },
      ...overrides,
    },
  };
}


function withSecret(): Headers {
  return new Headers({ [SECRET_HEADER]: TEST_SECRET });
}

describe('TelegramAdapter', () => {
  const adapter = new TelegramAdapter();

  beforeEach(() => {
    vi.mocked(getSettings).mockReset();
    vi.mocked(getSettings).mockResolvedValue({
      telegramWebhookSecret: TEST_SECRET,
    } as any);
  });

  describe('channel', () => {
    it('всегда TELEGRAM', () => {
      expect(adapter.channel).toBe('TELEGRAM');
    });
  });

  describe('parseWebhook — валидные', () => {
    it('парсит обычное текстовое сообщение', async () => {
      const result = await adapter.parseWebhook(makeUpdate(), withSecret());
      expect(result).not.toBeNull();
      expect(result!.channel).toBe('TELEGRAM');
      expect(result!.text).toBe('Привет');
      expect(result!.externalChatId).toBe('100500');
      expect(result!.externalMessageId).toBe('1');
      expect(result!.username).toBe('ivan');
      expect(result!.displayName).toBe('Иван Петров');
    });

    it('имя из одного first_name (без last_name)', async () => {
      const update = makeUpdate();
      // delete, не override — undefined триггерит default в makeUpdate
      delete update.message.from.last_name;
      const result = await adapter.parseWebhook(update, withSecret());
      expect(result!.displayName).toBe('Иван');
    });

    it('displayName из одного last_name (если нет first_name)', async () => {
      const update = makeUpdate();
      delete update.message.from.first_name;
      const result = await adapter.parseWebhook(update, withSecret());
      expect(result).not.toBeNull();
      // Адаптер собирает displayName из доступных частей,
      // поэтому при отсутствии имени остаётся фамилия.
      expect(result!.displayName).toBe('Петров');
    });

    it('displayName undefined если у from нет ни имени, ни фамилии', async () => {
      const update = makeUpdate();
      delete update.message.from.first_name;
      delete update.message.from.last_name;
      const result = await adapter.parseWebhook(update, withSecret());
      expect(result).not.toBeNull();
      expect(result!.displayName).toBeUndefined();
    });

    it('displayName undefined если нет from', async () => {
      const update = makeUpdate();
      delete update.message.from;
      const result = await adapter.parseWebhook(update, withSecret());
      expect(result).not.toBeNull();
      expect(result!.displayName).toBeUndefined();
      expect(result!.username).toBeUndefined();
    });

    it('сохраняет rawPayload', async () => {
      const update = makeUpdate();
      const result = await adapter.parseWebhook(update, withSecret());
      expect(result!.rawPayload).toEqual(update);
    });
  });

  describe('parseWebhook — отсеиваем', () => {
    it('нет message → null', async () => {
      expect(
        await adapter.parseWebhook({ update_id: 1 }, withSecret()),
      ).toBeNull();
    });

    it('нет text (стикер) → null', async () => {
      expect(
        await adapter.parseWebhook(makeUpdate({ text: null }), withSecret()),
      ).toBeNull();
    });

    it('пустой text "" → null', async () => {
      expect(
        await adapter.parseWebhook(makeUpdate({ text: '' }), withSecret()),
      ).toBeNull();
    });

    it('группа → null', async () => {
      expect(
        await adapter.parseWebhook(
          makeUpdate({ chatType: 'group' }),
          withSecret(),
        ),
      ).toBeNull();
    });

    it('канал → null', async () => {
      expect(
        await adapter.parseWebhook(
          makeUpdate({ chatType: 'channel' }),
          withSecret(),
        ),
      ).toBeNull();
    });

    it('supergroup → null', async () => {
      expect(
        await adapter.parseWebhook(
          makeUpdate({ chatType: 'supergroup' }),
          withSecret(),
        ),
      ).toBeNull();
    });

    it('edited_message не обрабатывается как новое', async () => {
      const update = {
        update_id: 3,
        edited_message: {
          message_id: 1,
          chat: { id: 100500, type: 'private', username: 'ivan' },
          from: { id: 100500, first_name: 'Иван', username: 'ivan' },
          text: 'Изменённый текст',
        },
      };
      expect(await adapter.parseWebhook(update, withSecret())).toBeNull();
    });
  });

  describe('parseWebhook — callback_query', () => {
    it('парсит callback_query (кнопки в ответ на сообщение)', async () => {
      const result = await adapter.parseWebhook(makeCallback(), withSecret());
      expect(result).not.toBeNull();
      expect(result!.channel).toBe('TELEGRAM');
      expect(result!.callbackQueryId).toBe('cb-123');
      expect(result!.callbackData).toBe('welcome_ack');
      expect(result!.externalChatId).toBe('100500');
    });

    it('callback без data не падает', async () => {
      const cb = makeCallback();
      delete cb.callback_query.data;
      const result = await adapter.parseWebhook(cb, withSecret());
      expect(result).not.toBeNull();
      expect(result!.callbackData).toBeUndefined();
    });
  });

  describe('parseWebhook — secret token', () => {
    it('отклоняет запрос без secret token', async () => {
      const result = await adapter.parseWebhook(makeUpdate(), new Headers());
      expect(result).toBeNull();
    });

    it('отклоняет запрос с неверным secret token', async () => {
      const headers = new Headers({ [SECRET_HEADER]: 'wrong-secret' });
      const result = await adapter.parseWebhook(makeUpdate(), headers);
      expect(result).toBeNull();
    });

    it('принимает запрос с верным secret token', async () => {
      const result = await adapter.parseWebhook(makeUpdate(), withSecret());
      expect(result).not.toBeNull();
    });
  });
});