import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deals = await prisma.deal.findMany({
      where: {
        organizationId: session.user.organizationId,
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
    });

    const sortedDeals = deals.sort((a, b) => {
      const dateA = a.messages[0]?.createdAt.getTime() || 0;
      const dateB = b.messages[0]?.createdAt.getTime() || 0;
      return dateB - dateA;
    });

    return NextResponse.json(sortedDeals);
  } catch (error) {
    console.error('[INBOX_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}