import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAdapter } from '@/lib/channels/registry';
import { messageService } from '@/services/message.service';
import { TelegramApiError } from '@/lib/channels/telegram/client';
import { NotFoundError } from '@/lib/errors';

const SendSchema = z.object({
  dealId: z.string().cuid(),
  text: z.string().trim().min(1, 'Сообщение не может быть пустым').max(4000),
  channel: z.enum(['TELEGRAM', 'WEB']).optional(),
});

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { dealId, text, channel: requestedChannel } = parsed.data;
  const { organizationId } = session.user;

  try {
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId },
      select: {
        id: true,
        publicToken: true,
        contacts: {
          select: {
            id: true,
            telegramChatId: true,
            telegramUsername: true,
          },
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Сделка не найдена' }, { status: 404 });
    }

    let targetChannel: 'TELEGRAM' | 'WEB' | null = null;
    let contact: { id: string; telegramChatId: string | null } | null = null;

    if (requestedChannel === 'TELEGRAM' || !requestedChannel) {
      const tgContact = deal.contacts.find((c) => c.telegramChatId);
      if (tgContact?.telegramChatId) {
        targetChannel = 'TELEGRAM';
        contact = { id: tgContact.id, telegramChatId: tgContact.telegramChatId };
      }
    }

    if (!targetChannel && deal.publicToken && (requestedChannel === 'WEB' || !requestedChannel)) {
      targetChannel = 'WEB';
      
      const webContact = deal.contacts.find((c) => c.telegramUsername?.startsWith('web:'));
      
      if (webContact) {
        contact = { id: webContact.id, telegramChatId: null };
      } else {
        const username = `web:${deal.publicToken}`;
        try {
          const created = await prisma.contact.create({
            data: {
              organizationId,
              firstName: 'Клиент из веб-чата',
              telegramUsername: username,
            },
            select: { id: true, telegramChatId: true },
          });
          contact = { id: created.id, telegramChatId: null };
        } catch (e: unknown) {
          if (
            typeof e === 'object' &&
            e !== null &&
            'code' in e &&
            (e as { code: unknown }).code === 'P2002'
          ) {
            const existing = await prisma.contact.findFirst({
              where: { organizationId, telegramUsername: username },
              select: { id: true, telegramChatId: true },
            });
            if (!existing) throw e;
            contact = { id: existing.id, telegramChatId: null };
          } else {
            throw e;
          }
        }

        if (contact) {
          await prisma.deal.update({
            where: { id: deal.id },
            data: { contacts: { connect: { id: contact.id } } },
          });
        }
      }
    }

    if (!targetChannel || !contact) {
      return NextResponse.json(
        { error: 'Нет активного канала для связи с клиентом' },
        { status: 400 },
      );
    }

    if (targetChannel === 'TELEGRAM' && contact.telegramChatId) {
      const adapter = getAdapter('TELEGRAM');
      const result = await adapter.sendMessage(contact.telegramChatId, text);

      const { message } = await messageService.save({
        organizationId,
        contactId: contact.id,
        dealId: deal.id,
        channel: 'TELEGRAM',
        direction: 'OUT',
        externalChatId: contact.telegramChatId,
        externalMessageId: result.externalId,
        content: text,
      });

      return NextResponse.json(message, { status: 201 });
    }

    if (targetChannel === 'WEB' && deal.publicToken) {
      const { message } = await messageService.save({
        organizationId,
        contactId: contact.id,
        dealId: deal.id,
        channel: 'WEB',
        direction: 'OUT',
        externalChatId: deal.publicToken,
        externalMessageId: randomUUID(), 
        content: text,
      });

      return NextResponse.json(message, { status: 201 });
    }

    return NextResponse.json({ error: 'Ошибка маршрутизации канала' }, { status: 500 });
  } catch (error: unknown) {
    console.error('[messages/send]', { dealId, organizationId, error });

    if (error instanceof TelegramApiError) {
      return NextResponse.json(
        { error: `Telegram: ${error.description}` },
        { status: 502 },
      );
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Не удалось отправить сообщение' },
      { status: 500 },
    );
  }
}