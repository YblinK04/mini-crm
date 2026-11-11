import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSendMail, mockVerify, mockCreateTransport } = vi.hoisted(() => ({
  mockSendMail: vi.fn(),
  mockVerify: vi.fn(),
  mockCreateTransport: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}));

const { mockGetSettings } = vi.hoisted(() => ({
  mockGetSettings: vi.fn(),
}));

vi.mock('@/lib/settings', () => ({
  getSettings: mockGetSettings,
}));

import { sendEmail, testSmtpConnection } from './email.service';

const TIMEOUT_MS = 10_000;

describe('email.service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCreateTransport.mockReturnValue({
      sendMail: mockSendMail,
      verify: mockVerify,
    });
    mockSendMail.mockResolvedValue({});
  });

  describe('sendEmail', () => {
    it('возвращает false если SMTP не настроен', async () => {
      mockGetSettings.mockResolvedValue({
        smtpHost: null,
        smtpUser: null,
        smtpPassword: null,
      });

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      });

      expect(result).toBe(false);
      expect(mockCreateTransport).not.toHaveBeenCalled();
    });

    it('возвращает false если getSettings вернул null', async () => {
      mockGetSettings.mockResolvedValue(null);

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      });

      expect(result).toBe(false);
      expect(mockCreateTransport).not.toHaveBeenCalled();
    });

    it('возвращает false если host пустой', async () => {
      mockGetSettings.mockResolvedValue({
        smtpHost: '',
        smtpUser: 'user@example.com',
        smtpPassword: 'pass',
      });

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      });

      expect(result).toBe(false);
    });

    it('отправляет письмо и возвращает true', async () => {
      mockGetSettings.mockResolvedValue({
        smtpHost: 'smtp.yandex.ru',
        smtpPort: 465,
        smtpSecure: true,
        smtpUser: 'user@yandex.ru',
        smtpPassword: 'app-password',
        smtpFrom: 'RealCRM <user@yandex.ru>',
      });
      mockSendMail.mockResolvedValue({ messageId: 'msg-id' });

      const result = await sendEmail({
        to: 'client@example.com',
        subject: '📥 Новая заявка',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result).toBe(true);
      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.yandex.ru',
          port: 465,
          secure: true,
          requireTLS: false,
        }),
      );
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'client@example.com',
          subject: '📥 Новая заявка',
          from: 'RealCRM <user@yandex.ru>',
        }),
      );
    });

    it('использует smtpUser как from, если smtpFrom не задан', async () => {
      mockGetSettings.mockResolvedValue({
        smtpHost: 'smtp.mail.ru',
        smtpPort: 465,
        smtpSecure: true,
        smtpUser: 'user@mail.ru',
        smtpPassword: 'pass',
        smtpFrom: null,
      });

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>x</p>',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'user@mail.ru' }),
      );
    });

    it('использует smtpUser как from, если smtpFrom пустая строка', async () => {
      mockGetSettings.mockResolvedValue({
        smtpHost: 'smtp.mail.ru',
        smtpPort: 465,
        smtpSecure: true,
        smtpUser: 'user@mail.ru',
        smtpPassword: 'pass',
        smtpFrom: '',
      });

      await sendEmail({ to: 't@t.t', subject: 's', html: 'h' });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'user@mail.ru' }),
      );
    });

    it('возвращает false при ошибке отправки', async () => {
      mockGetSettings.mockResolvedValue({
        smtpHost: 'smtp.yandex.ru',
        smtpPort: 465,
        smtpSecure: true,
        smtpUser: 'user@yandex.ru',
        smtpPassword: 'wrong-password',
      });
      mockSendMail.mockRejectedValue(new Error('Auth failed'));

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>x</p>',
      });

      expect(result).toBe(false);
    });

    it('secure=true и requireTLS=false для smtpSecure=true (порт 465)', async () => {
      mockGetSettings.mockResolvedValue({
        smtpHost: 'smtp.yandex.ru',
        smtpPort: 465,
        smtpSecure: true,
        smtpUser: 'u',
        smtpPassword: 'p',
      });

      await sendEmail({ to: 't@t.t', subject: 's', html: 'h' });

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({ secure: true, requireTLS: false }),
      );
    });

    it('secure=false и requireTLS=true для smtpSecure=false (порт 587)', async () => {
      mockGetSettings.mockResolvedValue({
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'u',
        smtpPassword: 'p',
      });

      await sendEmail({ to: 't@t.t', subject: 's', html: 'h' });

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({ secure: false, requireTLS: true }),
      );
    });

    it('secure управляется полем smtpSecure, а не портом', async () => {
      mockGetSettings.mockResolvedValue({
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpSecure: true,
        smtpUser: 'u',
        smtpPassword: 'p',
      });

      await sendEmail({ to: 't@t.t', subject: 's', html: 'h' });

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({ secure: true }),
      );
    });

    it('дефолт порта — 465, если smtpPort = null', async () => {
      mockGetSettings.mockResolvedValue({
        smtpHost: 'smtp.yandex.ru',
        smtpPort: null,
        smtpSecure: true,
        smtpUser: 'u',
        smtpPassword: 'p',
      });

      await sendEmail({ to: 't@t.t', subject: 's', html: 'h' });

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({ port: 465 }),
      );
    });

    it('устанавливает таймауты 10 секунд', async () => {
      mockGetSettings.mockResolvedValue({
        smtpHost: 'smtp.yandex.ru',
        smtpPort: 465,
        smtpSecure: true,
        smtpUser: 'u',
        smtpPassword: 'p',
      });

      await sendEmail({ to: 't@t.t', subject: 's', html: 'h' });

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionTimeout: TIMEOUT_MS,
          greetingTimeout: TIMEOUT_MS,
          socketTimeout: TIMEOUT_MS,
        }),
      );
    });
  });

  describe('testSmtpConnection', () => {
    it('возвращает ошибку если SMTP не настроен', async () => {
      mockGetSettings.mockResolvedValue({
        smtpHost: null,
        smtpUser: null,
        smtpPassword: null,
      });

      const result = await testSmtpConnection();
      expect(result.ok).toBe(false);
      expect(result.error).toBe('SMTP не настроен');
    });

    it('возвращает ошибку если getSettings вернул null', async () => {
      mockGetSettings.mockResolvedValue(null);

      const result = await testSmtpConnection();
      expect(result.ok).toBe(false);
      expect(result.error).toBe('SMTP не настроен');
    });

    it('возвращает ok если verify прошёл', async () => {
      mockGetSettings.mockResolvedValue({
        smtpHost: 'smtp.yandex.ru',
        smtpPort: 465,
        smtpSecure: true,
        smtpUser: 'u',
        smtpPassword: 'p',
      });
      mockVerify.mockResolvedValue(true);

      const result = await testSmtpConnection();
      expect(result.ok).toBe(true);
    });

    it('возвращает ошибку если verify упал', async () => {
      mockGetSettings.mockResolvedValue({
        smtpHost: 'smtp.yandex.ru',
        smtpPort: 465,
        smtpSecure: true,
        smtpUser: 'u',
        smtpPassword: 'wrong',
      });
      mockVerify.mockRejectedValue(new Error('Auth failed'));

      const result = await testSmtpConnection();
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Auth failed');
    });

    it('возвращает generic-ошибку если verify бросил не Error', async () => {
      mockGetSettings.mockResolvedValue({
        smtpHost: 'smtp.yandex.ru',
        smtpPort: 465,
        smtpSecure: true,
        smtpUser: 'u',
        smtpPassword: 'p',
      });
      mockVerify.mockRejectedValue('string error');

      const result = await testSmtpConnection();
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Неизвестная ошибка');
    });
  });
});