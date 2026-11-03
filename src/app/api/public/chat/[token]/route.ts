import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimiter } from '@/lib/rate-limiter';

const MAX_MESSAGES = 200;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (rateLimiter.check(`public-chat:${ip}`, 30, 60_000).limited) {
    return NextResponse.json(
      { error: 'Слишком много запросов. Попробуйте позже.' },
      { status: 429 },
    );
  }

  const { token } = await params;

  try {
    const deal = await prisma.deal.findUnique({
      where: { publicToken: token },
      select: {
        id: true,
        title: true,
        publicTokenExpiresAt: true,
        organization: { select: { name: true, isActive: true } },
        contacts: {
          where: { telegramUsername: `web:${token}` },
          take: 1,
          select: { firstName: true },
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Чат не найден' }, { status: 404 });
    }

    if (!deal.organization.isActive) {
      return NextResponse.json(
        { error: 'Организация недоступна' },
        { status: 403 },
      );
    }

    if (
      deal.publicTokenExpiresAt &&
      deal.publicTokenExpiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: 'Срок действия ссылки истёк' },
        { status: 410 },
      );
    }

    const rows = await prisma.message.findMany({
      where: {
        dealId: deal.id,
        channel: 'WEB',
        externalChatId: token,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: MAX_MESSAGES,
      select: {
        id: true,
        content: true,
        direction: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        id: deal.id,
        title: deal.title,
        organization: deal.organization,
        contactName: deal.contacts[0]?.firstName ?? null,
        messages: rows.reverse(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      },
    );
  } catch (error: unknown) {
    console.error('[PUBLIC_CHAT_GET]', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}