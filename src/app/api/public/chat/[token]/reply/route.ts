import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ReplySchema = z.object({
  text: z.string().trim().min(1, 'Сообщение не может быть пустым').max(4000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { token } = await params;
  const body = await request.json().catch(() => null);

  const parsed = ReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Некорректное сообщение', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const deal = await prisma.deal.findUnique({
      where: { publicToken: token },
      select: { id: true, organizationId: true },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Чат не найден' }, { status: 404 });
    }

    if (deal.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contact = await prisma.contact.findFirst({
      where: {
        organizationId: deal.organizationId,
        telegramUsername: `web:${token}`,
      },
      select: { id: true },
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Контакт для веб-чата не найден' },
        { status: 404 },
      );
    }

    const message = await prisma.message.create({
      data: {
        organizationId: deal.organizationId,
        contactId: contact.id,
        dealId: deal.id,
        channel: 'WEB',
        direction: 'OUT',
        externalChatId: token,
        externalMessageId: randomUUID(),
        content: parsed.data.text,
        rawPayload: { authorId: session.user.id },
      },
      select: {
        id: true,
        direction: true,
        channel: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json(message, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      },
    });
  } catch (error: unknown) {
    console.error('[PUBLIC_CHAT_REPLY]', { error });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}