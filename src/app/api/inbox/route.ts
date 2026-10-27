import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;

  try {
    const deals = await prisma.deal.findMany({
      where: {
        organizationId,
        messages: { some: {} }, 
      },
      select: {
        id: true,
        title: true,
        publicToken: true, 
        contacts: {
          take: 1,
          select: {
            firstName: true,
            lastName: true,
            telegramChatId: true, 
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            direction: true,
            channel: true,
            createdAt: true,
          },
        },
      },
      take: 100, 
    });

    const sortedDeals = deals.sort((a, b) => {
      const dateA = a.messages[0]?.createdAt.getTime() || 0;
      const dateB = b.messages[0]?.createdAt.getTime() || 0;
      return dateB - dateA;
    });

    return NextResponse.json(sortedDeals, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      },
    });
  } catch (error) {
    console.error('[INBOX_GET]', { organizationId, error });
    return NextResponse.json({ error: 'Не удалось загрузить чаты' }, { status: 500 });
  }
}