import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimiter } from '@/lib/rate-limiter';

const MAX_MESSAGES = 200;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (rateLimiter.check(`public-chat-get:${ip}`, 30, 60_000).limited) {
    return NextResponse.json(
      { status: 'error', error: 'Слишком много запросов' },
      { status: 429, headers: NO_STORE_HEADERS },
    );
  }

  const { token } = await params;

  try {
    const deal = await prisma.deal.findUnique({
      where: { publicToken: token },
      select: {
        id: true,
        title: true,
        organizationId: true,
        chatClosedAt: true,
        publicTokenExpiresAt: true,
        organization: { select: { name: true } },
        contacts: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            blockedAt: true,
          },
        },
        messages: {
          where: {
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
        },
      },
    });

    if (!deal) {
      return NextResponse.json(
        { status: 'not_found' },
        { status: 404, headers: NO_STORE_HEADERS },
      );
    }

    if (deal.publicTokenExpiresAt && deal.publicTokenExpiresAt < new Date()) {
      return NextResponse.json(
        {
          status: 'expired',
          organizationName: deal.organization.name,
        },
        { status: 410, headers: NO_STORE_HEADERS },
      );
    }

    const contact = deal.contacts[0];

    if (contact?.blockedAt) {
      return NextResponse.json(
        {
          status: 'blocked',
          organizationName: deal.organization.name,
          contactFirstName: contact.firstName,
        },
        { status: 403, headers: NO_STORE_HEADERS },
      );
    }

    if (deal.chatClosedAt) {
      return NextResponse.json(
        {
          status: 'closed',
          organizationName: deal.organization.name,
          contactFirstName: contact?.firstName ?? null,
        },
        { status: 410, headers: NO_STORE_HEADERS },
      );
    }

    return NextResponse.json(
      {
        status: 'active',
        id: deal.id,
        organization: deal.organization,
        contactName: contact?.firstName ?? null,
        messages: deal.messages.reverse(),
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error('[PUBLIC_CHAT_GET]', error);
    return NextResponse.json(
      { status: 'error' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}