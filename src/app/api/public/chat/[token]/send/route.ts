import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const SendSchema = z.object({
  text: z.string().trim().min(1, 'Сообщение не может быть пустым').max(4000),
});

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const recentRequests = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = recentRequests.get(key);

  if (!entry || entry.resetAt < now) {
    recentRequests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (recentRequests.size > 10_000) {
      for (const [k, v] of recentRequests) {
        if (v.resetAt < now) recentRequests.delete(k);
      }
    }
    return true;
  }
  if (entry.count >= MAX_PER_WINDOW) return false;
  entry.count++;
  return true;
}

function webChatUsername(token: string): string {
  return `web:${token}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await params;

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (!rateLimit(`${ip}:${token}`)) {
    return NextResponse.json(
      { error: 'Слишком много сообщений. Подождите минуту.' },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);

  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Некорректное сообщение', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const deal = await prisma.deal.findUnique({
      where: { publicToken: token },
      select: {
        id: true,
        organizationId: true,
        publicTokenExpiresAt: true,
        contacts: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Чат не найден' }, { status: 404 });
    }

    if (deal.publicTokenExpiresAt && deal.publicTokenExpiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Срок действия ссылки истёк' },
        { status: 410 },
      );
    }
    let contactId = deal.contacts[0]?.id;

    if (!contactId) {
      const username = webChatUsername(token);
      try {
        const created = await prisma.contact.create({
          data: {
            organizationId: deal.organizationId,
            firstName: 'Клиент из чата',
            telegramUsername: username,
          },
          select: { id: true },
        });
        contactId = created.id;
      } catch (e: unknown) {
        if (
          typeof e === 'object' &&
          e !== null &&
          'code' in e &&
          (e as { code: unknown }).code === 'P2002'
        ) {
          const existing = await prisma.contact.findFirst({
            where: {
              organizationId: deal.organizationId,
              telegramUsername: username,
            },
            select: { id: true },
          });
          if (!existing) throw e;
          contactId = existing.id;
        } else {
          throw e;
        }
      }

      await prisma.deal.update({
        where: { id: deal.id },
        data: { contacts: { connect: { id: contactId } } },
      });
    }

    const message = await prisma.message.create({
  data: {
    organizationId: deal.organizationId,
    contactId,
    dealId: deal.id,
    channel: 'WEB',
    direction: 'IN',
    externalChatId: token,
    externalMessageId: randomUUID(),
    content: parsed.data.text,
    rawPayload: {
      ip,
      userAgent: request.headers.get('user-agent') ?? null,
    },
  },
  select: {
    id: true,
    direction: true,
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
    console.error('[PUBLIC_CHAT_POST]', {
      error,
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}