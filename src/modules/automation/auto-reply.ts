import { randomUUID } from 'crypto';
import type { Message, Contact } from '@prisma/client';
import { events } from '@/lib/events';
import { getSettings } from '@/lib/settings';
import { getAdapter } from '@/lib/channels/registry';
import { prisma } from '@/lib/prisma';

interface MessageReceivedPayload {
  message: Message;
  contact: Contact;
  dealId: string | null;
  organizationId: string;
}

const g = globalThis as typeof globalThis & {
  __autoReplyRegistered?: boolean;
};

export function registerAutoReply() {
  if (g.__autoReplyRegistered) return;
  g.__autoReplyRegistered = true;

  events.on<MessageReceivedPayload>(
    'message.received',
    async ({ message, contact, dealId, organizationId }) => {
      try {
        const settings = await getSettings();
        if (!settings?.autoReplyEnabled || !settings.autoReplyText) return;

        if (message.direction !== 'IN') return;
        if (!dealId) return;

        const org = await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { isActive: true },
        });
        if (!org?.isActive) return;

        const claim = await prisma.contact.updateMany({
          where: { id: contact.id, autoReplySentAt: null },
          data: { autoReplySentAt: new Date() },
        });
        if (claim.count === 0) return;

        const name =
          contact.firstName && contact.firstName !== 'Без имени'
            ? contact.firstName
            : null;

        const text = (
          name
            ? settings.autoReplyText.replace(/\{\{имя\}\}/g, name)
            : settings.autoReplyText.replace(/,?\s*\{\{имя\}\}/g, '')
        ).trim();

        if (!text) {
          await prisma.contact.update({
            where: { id: contact.id },
            data: { autoReplySentAt: null },
          }).catch(() => {});
          return;
        }

        try {
          switch (message.channel) {
            case 'TELEGRAM': {
              if (!contact.telegramChatId) {
                console.warn('[auto-reply] No telegramChatId, skipping');
                break;
              }
              const adapter = getAdapter('TELEGRAM');
              const result = await adapter.sendMessage(contact.telegramChatId, text);
              await prisma.message.create({
                data: {
                  organizationId,
                  contactId: contact.id,
                  dealId,
                  channel: 'TELEGRAM',
                  direction: 'OUT',
                  externalChatId: contact.telegramChatId,
                  externalMessageId: result.externalId,
                  content: text,
                  rawPayload: { autoReply: true },
                },
              });
              break;
            }
            case 'WEB': {
              await prisma.message.create({
                data: {
                  organizationId,
                  contactId: contact.id,
                  dealId,
                  channel: 'WEB',
                  direction: 'OUT',
                  externalChatId: message.externalChatId,
                  externalMessageId: `auto_${randomUUID()}`,
                  content: text,
                  rawPayload: { autoReply: true },
                },
              });
              break;
            }
            default:
              console.warn('[auto-reply] Unsupported channel:', message.channel);
              await prisma.contact.update({
                where: { id: contact.id },
                data: { autoReplySentAt: null },
              }).catch(() => {});
          }
        } catch (sendError) {
          await prisma.contact.update({
            where: { id: contact.id },
            data: { autoReplySentAt: null },
          }).catch(() => {});
          throw sendError;
        }
      } catch (error) {
        console.error('[AUTO_REPLY_ERROR]', { dealId, error });
      }
    },
  );
}