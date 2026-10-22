import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const recentRequests = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = recentRequests.get(ip);

  if (!entry || entry.resetAt < now) {
    recentRequests.set(ip, { count: 1, resetAt: now + WINDOW_MS });
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

const MAX_MESSAGES = 200;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (!rateLimit(ip)) {
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
        organization: { select: { name: true } },
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