
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { contactService } from '@/services/contact.service';
import { messageService } from '@/services/message.service';
import { events } from '@/lib/events';
import type { IncomingMessage } from './types';

export async function handleIncomingMessage(
  msg: IncomingMessage,
): Promise<void> {
  const settings = await getSettings();

  if (!settings) {
    console.warn('[handler] Settings not configured, skipping message');
    return;
  }

  const { organizationId } = settings;

  const contact = await contactService.findOrCreateByExternalId({
    organizationId,
    channel: msg.channel,
    externalId: msg.externalChatId,
    displayName: msg.displayName,
    username: msg.username,
  });

  
  const dealId = await findLatestDealId(organizationId, contact.id);

 
  const { message, created } = await messageService.save({
    organizationId,
    contactId: contact.id,
    dealId,
    channel: msg.channel,
    direction: 'IN',
    externalChatId: msg.externalChatId,
    externalMessageId: msg.externalMessageId,
    content: msg.text,
    rawPayload: msg.rawPayload,
  });

  if (!created) return;

  await events.emit('message.received', {
    message,
    contact,
    dealId,
    organizationId,
  });
}

async function findLatestDealId(
  organizationId: string,
  contactId: string,
): Promise<string | null> {
  const deal = await prisma.deal.findFirst({
    where: {
      organizationId,
      contacts: { some: { id: contactId } },
    },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });
  return deal?.id ?? null;
}