
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAdapter } from '@/lib/channels/registry';
import { messageService } from '@/services/message.service';
import { TelegramApiError } from '@/lib/channels/telegram/client';
import { NotFoundError } from '@/lib/errors';

const SendSchema = z.object({
  dealId: z.string().cuid(),
  text: z.string().trim().min(1, 'Сообщение не может быть пустым').max(4000),
});

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = session.user.organizationId;

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

  const { dealId, text } = parsed.data;

  try {
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId },
      select: {
        id: true,
        contacts: {
          where: { telegramChatId: { not: null } },
          select: { id: true, telegramChatId: true },
          take: 1,
        },
      },
    });

    if (!deal) {
      return NextResponse.json(
        { error: 'Сделка не найдена' },
        { status: 404 },
      );
    }

    const contact = deal.contacts[0];
    if (!contact?.telegramChatId) {
      return NextResponse.json(
        { error: 'У сделки нет контакта с привязанным Telegram' },
        { status: 400 },
      );
    }

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
  } catch (error) {
    if (error instanceof TelegramApiError) {
      if (error.errorCode === 429 && error.parameters?.retry_after) {
        return NextResponse.json(
          {
            error: 'Слишком много сообщений. Попробуйте позже.',
            retryAfter: error.parameters.retry_after,
          },
          { status: 429 },
        );
      }
      return NextResponse.json(
        { error: `Telegram: ${error.description}` },
        { status: 502 },
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error('[messages/send]', {
      organizationId,
      userId: session.user.id,
      dealId,
      error,
    });
    return NextResponse.json(
      { error: 'Не удалось отправить сообщение' },
      { status: 500 },
    );
  }
}