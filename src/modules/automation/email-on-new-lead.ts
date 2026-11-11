import { events } from '@/lib/events';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { sendEmail } from '@/services/email.service';
import type { Contact, Message } from '@prisma/client';

interface MessageReceivedPayload {
  message: Message;
  contact: Contact;
  dealId: string | null;
  organizationId: string;
}

declare global {
  var __emailOnNewLeadRegistered: boolean | undefined;
}
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function sanitizeHeader(s: string): string {
  return s.replace(/[\r\n]/g, ' ').slice(0, 200);
}

export function registerEmailOnNewLead() {
  if (globalThis.__emailOnNewLeadRegistered) return;
  globalThis.__emailOnNewLeadRegistered = true;

  console.log('📧 [EMAIL] Подписка на новые заявки зарегистрирована');

  events.on<MessageReceivedPayload>(
    'message.received',
    async ({ message, contact }) => {
      try {
        if (message.direction !== 'IN') return;

        const settings = await getSettings();
        if (!settings?.emailNotificationsEnabled) return;
        if (!settings.notifyOnNewLead) return;
        if (!settings.ownerEmail) return;

        const previousCount = await prisma.message.count({
          where: {
            contactId: contact.id,
            direction: 'IN',
            id: { not: message.id },
          },
        });
        if (previousCount > 0) return;

        const publicUrl = process.env.PUBLIC_URL;
        if (!publicUrl) {
          console.warn(
            '[email-on-new-lead] PUBLIC_URL не задан — ссылка в письме будет нерабочей',
          );
        }
        const inboxUrl = `${publicUrl || 'http://localhost:3000'}/inbox-pipeline`;

        const fullName = escapeHtml(
          `${contact.firstName} ${contact.lastName ?? ''}`.trim(),
        );
        const subject = sanitizeHeader(
          `📥 Новая заявка от ${contact.firstName}${contact.lastName ? ' ' + contact.lastName : ''}`,
        );

        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px;">
            <h2 style="margin: 0 0 16px; font-size: 20px;">📥 Новая заявка</h2>
            <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 4px 0; color: #666;">Клиент:</td>
                <td style="padding: 4px 0;"><strong>${fullName}</strong></td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Телефон:</td>
                <td style="padding: 4px 0;">${contact.phone ? escapeHtml(contact.phone) : '—'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Email:</td>
                <td style="padding: 4px 0;">${contact.email ? escapeHtml(contact.email) : '—'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Telegram:</td>
                <td style="padding: 4px 0;">${
                  contact.telegramUsername
                    ? '@' + escapeHtml(contact.telegramUsername)
                    : '—'
                }</td>
              </tr>
            </table>
            <p style="margin: 24px 0 0;">
              <a href="${inboxUrl}" style="display: inline-block; background: #3b82f6; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                Открыть Входящие →
              </a>
            </p>
          </div>
        `;

        await sendEmail({
          to: settings.ownerEmail,
          subject,
          html,
          text: `Новая заявка от ${contact.firstName}. Открыть: ${inboxUrl}`,
        });
      } catch (error) {
        console.error('[email-on-new-lead] Ошибка:', error);
      }
    },
  );
}