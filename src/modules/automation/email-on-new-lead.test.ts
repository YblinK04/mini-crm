import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockSendEmail, mockGetSettings, mockCount, handlerRef } = vi.hoisted(
  () => ({
    mockSendEmail: vi.fn(),
    mockGetSettings: vi.fn(),
    mockCount: vi.fn(),
    handlerRef: {
      current: null as ((payload: any) => Promise<void>) | null,
    },
  }),
);

vi.mock('@/services/email.service', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/settings', () => ({ getSettings: mockGetSettings }));
vi.mock('@/lib/prisma', () => ({
  prisma: { message: { count: mockCount } },
}));
vi.mock('@/lib/events', () => ({
  events: {
    on: (eventName: string, handler: any) => {
      if (eventName === 'message.received') handlerRef.current = handler;
      return () => {};
    },
  },
}));

import { registerEmailOnNewLead } from './email-on-new-lead';

describe('email-on-new-lead', () => {
  let originalPublicUrl: string | undefined;

  beforeEach(() => {
  vi.resetAllMocks();
  handlerRef.current = null;

  delete (globalThis as { __emailOnNewLeadRegistered?: boolean })
    .__emailOnNewLeadRegistered;

  mockGetSettings.mockResolvedValue({
    emailNotificationsEnabled: true,
    notifyOnNewLead: true,
    ownerEmail: 'owner@example.com',
  });
  mockCount.mockResolvedValue(0);
  mockSendEmail.mockResolvedValue(true);

  originalPublicUrl = process.env.PUBLIC_URL;
  process.env.PUBLIC_URL = 'https://test.example.com';
});

  afterEach(() => {
    if (originalPublicUrl === undefined) delete process.env.PUBLIC_URL;
    else process.env.PUBLIC_URL = originalPublicUrl;
  });

  function registerAndGetHandler() {
    registerEmailOnNewLead();
    if (!handlerRef.current) throw new Error('Handler not registered');
    return handlerRef.current;
  }

  function makePayload(overrides: Partial<{ direction: 'IN' | 'OUT' }> = {}) {
    return {
      message: {
        id: 'msg-1',
        content: 'Хочу заказать сайт',
        direction: overrides.direction ?? 'IN',
        channel: 'TELEGRAM',
      },
      contact: {
        id: 'contact-1',
        firstName: 'Иван',
        lastName: 'Петров',
        phone: '+7 999 123-45-67',
        email: 'ivan@example.com',
        telegramUsername: 'ivan',
      },
      dealId: 'deal-1',
      organizationId: 'org-1',
    };
  }

  describe('условия отправки', () => {
    it('не отправляет если уведомления выключены', async () => {
      mockGetSettings.mockResolvedValue({
        emailNotificationsEnabled: false,
        notifyOnNewLead: true,
        ownerEmail: 'owner@example.com',
      });

      await registerAndGetHandler()(makePayload());
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('не отправляет если notifyOnNewLead=false', async () => {
      mockGetSettings.mockResolvedValue({
        emailNotificationsEnabled: true,
        notifyOnNewLead: false,
        ownerEmail: 'owner@example.com',
      });

      await registerAndGetHandler()(makePayload());
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('не отправляет если нет ownerEmail', async () => {
      mockGetSettings.mockResolvedValue({
        emailNotificationsEnabled: true,
        notifyOnNewLead: true,
        ownerEmail: null,
      });

      await registerAndGetHandler()(makePayload());
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('не отправляет на исходящее сообщение (direction=OUT)', async () => {
      await registerAndGetHandler()(makePayload({ direction: 'OUT' }));
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('не отправляет если у контакта уже есть сообщения (previousCount > 0)', async () => {
      mockCount.mockResolvedValue(5);

      await registerAndGetHandler()(makePayload());
      expect(mockSendEmail).not.toHaveBeenCalled();
    });
  });

  describe('отправка', () => {
    it('отправляет при первом сообщении от контакта', async () => {
      await registerAndGetHandler()(makePayload());

      expect(mockSendEmail).toHaveBeenCalledOnce();
      const args = mockSendEmail.mock.calls[0][0];
      expect(args.to).toBe('owner@example.com');
      expect(args.subject).toContain('Новая заявка');
      expect(args.subject).toContain('Иван');
      expect(args.html).toContain('Иван Петров');
      expect(args.html).toContain('+7 999 123-45-67');
      expect(args.html).toContain('@ivan');
      expect(args.html).toContain('/inbox-pipeline');
    });

    it('10 разных контактов за минуту → 10 писем (нет глобального throttle)', async () => {
      mockCount.mockResolvedValue(0);
      const handler = registerAndGetHandler();

      for (let i = 0; i < 10; i++) {
        const p = makePayload();
        await handler({
          ...p,
          message: { ...p.message, id: `msg-${i}` },
          contact: { ...p.contact, id: `contact-${i}` },
        });
      }

      expect(mockSendEmail).toHaveBeenCalledTimes(10);
    });

    it('5 сообщений от одного контакта → 1 письмо', async () => {
      mockCount
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(4);
      const handler = registerAndGetHandler();

      for (let i = 0; i < 5; i++) {
        const p = makePayload();
        await handler({
          ...p,
          message: { ...p.message, id: `msg-${i}` },
        });
      }

      expect(mockSendEmail).toHaveBeenCalledOnce();
    });
  });

  describe('XSS-защита', () => {
    it('экранирует HTML в имени контакта', async () => {
      const handler = registerAndGetHandler();
      const p = makePayload();
      await handler({
        ...p,
        contact: {
          ...p.contact,
          firstName: '<img src="https://evil.example/x">',
        },
      });

      const html = mockSendEmail.mock.calls[0][0].html;
      expect(html).toContain('&lt;img');
      expect(html).not.toContain('<img src="https://evil.example');
    });

    it('экранирует HTML в поле телефона', async () => {
      const handler = registerAndGetHandler();
      const p = makePayload();
      await handler({
        ...p,
        contact: { ...p.contact, phone: '<script>alert(1)</script>' },
      });

      const html = mockSendEmail.mock.calls[0][0].html;
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');
    });
  });

  describe('устойчивость', () => {
    it('ошибка в sendEmail не ломает обработчик', async () => {
      mockSendEmail.mockRejectedValue(new Error('SMTP down'));

      await expect(
        registerAndGetHandler()(makePayload()),
      ).resolves.not.toThrow();
    });

    it('ошибка в prisma не ломает обработчик', async () => {
      mockCount.mockRejectedValue(new Error('DB down'));

      await expect(
        registerAndGetHandler()(makePayload()),
      ).resolves.not.toThrow();
    });

    it('работает без PUBLIC_URL (fallback на localhost)', async () => {
      delete process.env.PUBLIC_URL;

      await registerAndGetHandler()(makePayload());

      const html = mockSendEmail.mock.calls[0][0].html;
      expect(html).toContain('http://localhost:3000/inbox-pipeline');
    });
  });
});