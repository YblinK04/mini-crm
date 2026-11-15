import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockSendMessage,
  mockGetAdapter,
  mockGetSettings,
  mockMessageCreate,
  mockContactUpdateMany,
  mockContactUpdate,
  mockOrganizationFindUnique,
  handlerRef,
} = vi.hoisted(() => ({
  mockSendMessage: vi.fn(),
  mockGetAdapter: vi.fn(),
  mockGetSettings: vi.fn(),
  mockMessageCreate: vi.fn(),
  mockContactUpdateMany: vi.fn(),
  mockContactUpdate: vi.fn(),
  mockOrganizationFindUnique: vi.fn(),
  handlerRef: {
    current: null as ((payload: any) => Promise<void>) | null,
  },
}));

vi.mock('@/lib/channels/registry', () => ({
  getAdapter: mockGetAdapter,
}));

vi.mock('@/lib/settings', () => ({
  getSettings: mockGetSettings,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    message: { create: mockMessageCreate },
    contact: {
      updateMany: mockContactUpdateMany,
      update: mockContactUpdate,
    },
    organization: { findUnique: mockOrganizationFindUnique },
  },
}));

vi.mock('@/lib/events', () => ({
  events: {
    on: (eventName: string, handler: any) => {
      if (eventName === 'message.received') handlerRef.current = handler;
      return () => {};
    },
  },
}));

import { registerAutoReply } from './auto-reply';

describe('auto-reply', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    handlerRef.current = null;
    delete (globalThis as { __autoReplyRegistered?: boolean })
      .__autoReplyRegistered;

    mockGetAdapter.mockReturnValue({
      sendMessage: mockSendMessage,
      channel: 'TELEGRAM' as const,
      parseWebhook: vi.fn(),
    });

    mockOrganizationFindUnique.mockResolvedValue({ isActive: true });
    mockContactUpdateMany.mockResolvedValue({ count: 1 });
    mockContactUpdate.mockResolvedValue({});
    mockMessageCreate.mockResolvedValue({});
    mockSendMessage.mockResolvedValue({ externalId: 'tg-msg-1' });
  });

  function registerAndGetHandler() {
    registerAutoReply();
    if (!handlerRef.current) throw new Error('Handler not registered');
    return handlerRef.current;
  }

  function makePayload(overrides: any = {}) {
    return {
      message: {
        id: 'msg-1',
        content: 'Привет',
        direction: 'IN',
        channel: 'TELEGRAM',
        externalChatId: '123',
      },
      contact: {
        id: 'contact-1',
        firstName: 'Иван',
        lastName: 'Петров',
        organizationId: 'org-1',
        telegramChatId: '123',
      },
      dealId: 'deal-1',
      organizationId: 'org-1',
      ...overrides,
    };
  }


  it('не отправляет если уведомления выключены', async () => {
    mockGetSettings.mockResolvedValue({
      autoReplyEnabled: false,
      autoReplyText: 'Здравствуйте!',
    });
    await registerAndGetHandler()(makePayload());
    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(mockMessageCreate).not.toHaveBeenCalled();
  });

  it('не отправляет если autoReplyText пустой', async () => {
    mockGetSettings.mockResolvedValue({
      autoReplyEnabled: true,
      autoReplyText: null,
    });
    await registerAndGetHandler()(makePayload());
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('не отправляет если нет settings', async () => {
    mockGetSettings.mockResolvedValue(null);
    await registerAndGetHandler()(makePayload());
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('не отправляет для OUT-сообщений', async () => {
    mockGetSettings.mockResolvedValue({
      autoReplyEnabled: true,
      autoReplyText: 'Здравствуйте!',
    });
    await registerAndGetHandler()(
      makePayload({ message: { direction: 'OUT', channel: 'TELEGRAM' } }),
    );
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('не отправляет если нет dealId', async () => {
    mockGetSettings.mockResolvedValue({
      autoReplyEnabled: true,
      autoReplyText: 'Здравствуйте!',
    });
    await registerAndGetHandler()(makePayload({ dealId: null }));
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('не отправляет если организация неактивна', async () => {
    mockGetSettings.mockResolvedValue({
      autoReplyEnabled: true,
      autoReplyText: 'Здравствуйте!',
    });
    mockOrganizationFindUnique.mockResolvedValue({ isActive: false });
    await registerAndGetHandler()(makePayload());
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('не отправляет если автоответ уже отправлялся (claim не удался)', async () => {
    mockGetSettings.mockResolvedValue({
      autoReplyEnabled: true,
      autoReplyText: 'Здравствуйте!',
    });
    mockContactUpdateMany.mockResolvedValue({ count: 0 });
    await registerAndGetHandler()(makePayload());
    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(mockMessageCreate).not.toHaveBeenCalled();
  });


  describe('TELEGRAM', () => {
    it('отправляет шаблон с подстановкой {{имя}}', async () => {
      mockGetSettings.mockResolvedValue({
        autoReplyEnabled: true,
        autoReplyText: 'Здравствуйте, {{имя}}! Мы получили заявку.',
      });

      await registerAndGetHandler()(makePayload());

      expect(mockSendMessage).toHaveBeenCalledWith(
        '123',
        'Здравствуйте, Иван! Мы получили заявку.',
      );
    });

    it('вырезает {{имя}} если имени нет (плейсхолдер)', async () => {
      mockGetSettings.mockResolvedValue({
        autoReplyEnabled: true,
        autoReplyText: 'Здравствуйте, {{имя}}!',
      });

      await registerAndGetHandler()(
        makePayload({
          contact: {
            id: 'contact-1',
            firstName: 'Без имени',
            telegramChatId: '123',
            organizationId: 'org-1',
          },
        }),
      );

      expect(mockSendMessage).toHaveBeenCalledWith('123', 'Здравствуйте!');
    });

    it('сохраняет автоответ как OUT-сообщение канала TELEGRAM', async () => {
      mockGetSettings.mockResolvedValue({
        autoReplyEnabled: true,
        autoReplyText: 'Автоответ',
      });

      await registerAndGetHandler()(makePayload());

      expect(mockMessageCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            direction: 'OUT',
            channel: 'TELEGRAM',
            content: 'Автоответ',
            externalChatId: '123',
          }),
        }),
      );
    });

    it('пропускает без telegramChatId и сбрасывает claim', async () => {
      mockGetSettings.mockResolvedValue({
        autoReplyEnabled: true,
        autoReplyText: 'Здравствуйте!',
      });

      await registerAndGetHandler()(
        makePayload({
          contact: {
            id: 'contact-1',
            firstName: 'Иван',
            organizationId: 'org-1',
            telegramChatId: null,
          },
        }),
      );

      expect(mockSendMessage).not.toHaveBeenCalled();
      expect(mockContactUpdate).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
        data: { autoReplySentAt: null },
      });
    });

    it('ошибка отправки не ломает handler и сбрасывает claim', async () => {
      mockGetSettings.mockResolvedValue({
        autoReplyEnabled: true,
        autoReplyText: 'Привет',
      });
      mockSendMessage.mockRejectedValue(new Error('TG down'));

      await expect(
        registerAndGetHandler()(makePayload()),
      ).resolves.not.toThrow();

      expect(mockContactUpdate).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
        data: { autoReplySentAt: null },
      });
    });
  });


  describe('WEB', () => {
    function makeWebPayload(overrides: any = {}) {
      return makePayload({
        message: {
          id: 'msg-1',
          content: 'Привет из PWA',
          direction: 'IN',
          channel: 'WEB',
          externalChatId: 'web-token-abc',
        },
        contact: {
          id: 'contact-web-1',
          firstName: 'Клиент из чата', 
          organizationId: 'org-1',
          telegramChatId: null,
        },
        ...overrides,
      });
    }

    it('не использует Telegram-адаптер', async () => {
      mockGetSettings.mockResolvedValue({
        autoReplyEnabled: true,
        autoReplyText: 'Здравствуйте!',
      });

      await registerAndGetHandler()(makeWebPayload());

      expect(mockGetAdapter).not.toHaveBeenCalled();
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('сохраняет автоответ в БД как WEB OUT', async () => {
      mockGetSettings.mockResolvedValue({
        autoReplyEnabled: true,
        autoReplyText: 'Автоответ из PWA',
      });

      await registerAndGetHandler()(makeWebPayload());

      expect(mockMessageCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            direction: 'OUT',
            channel: 'WEB',
            content: 'Автоответ из PWA',
            externalChatId: 'web-token-abc',
            dealId: 'deal-1',
            contactId: 'contact-web-1',
            organizationId: 'org-1',
          }),
        }),
      );
    });

    it('externalMessageId начинается с "auto_"', async () => {
      mockGetSettings.mockResolvedValue({
        autoReplyEnabled: true,
        autoReplyText: 'Ответ',
      });

      await registerAndGetHandler()(makeWebPayload());

      const call = mockMessageCreate.mock.calls[0][0];
      expect(call.data.externalMessageId).toMatch(/^auto_/);
    });

    it('rawPayload помечен { autoReply: true }', async () => {
      mockGetSettings.mockResolvedValue({
        autoReplyEnabled: true,
        autoReplyText: 'Ответ',
      });

      await registerAndGetHandler()(makeWebPayload());

      const call = mockMessageCreate.mock.calls[0][0];
      expect(call.data.rawPayload).toEqual({ autoReply: true });
    });

    it('вырезает {{имя}} для плейсхолдера "Клиент из чата"', async () => {
      mockGetSettings.mockResolvedValue({
        autoReplyEnabled: true,
        autoReplyText: 'Здравствуйте, {{имя}}!',
      });

      await registerAndGetHandler()(makeWebPayload());

      expect(mockMessageCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'Здравствуйте!',
          }),
        }),
      );
    });

    it('ошибка записи в БД сбрасывает claim', async () => {
      mockGetSettings.mockResolvedValue({
        autoReplyEnabled: true,
        autoReplyText: 'Ответ',
      });
      mockMessageCreate.mockRejectedValue(new Error('DB error'));

      await expect(
        registerAndGetHandler()(makeWebPayload()),
      ).resolves.not.toThrow();

      expect(mockContactUpdate).toHaveBeenCalledWith({
        where: { id: 'contact-web-1' },
        data: { autoReplySentAt: null },
      });
    });
  });


  describe('unsupported channel', () => {
    it('MAX → предупреждение и сброс claim (пока MAX не реализован)', async () => {
      mockGetSettings.mockResolvedValue({
        autoReplyEnabled: true,
        autoReplyText: 'Ответ',
      });

      await registerAndGetHandler()(
        makePayload({
          message: {
            direction: 'IN',
            channel: 'MAX',
            externalChatId: 'max-1',
          },
        }),
      );

      expect(mockSendMessage).not.toHaveBeenCalled();
      expect(mockMessageCreate).not.toHaveBeenCalled();
      expect(mockContactUpdate).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
        data: { autoReplySentAt: null },
      });
    });
  });
});