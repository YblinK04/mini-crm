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
        contacts: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: { firstName: true, lastName: true },
        },
        messages: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 1,
          select: {
            id: true,
            content: true,
            direction: true,
            createdAt: true,
          },
        },
      },
    });

    const sortedDeals = [...deals].sort((a, b) => {
      const aMsg = a.messages[0];
      const bMsg = b.messages[0];
      const aTime = aMsg?.createdAt.getTime() ?? 0;
      const bTime = bMsg?.createdAt.getTime() ?? 0;
      if (aTime !== bTime) return bTime - aTime;
      return (bMsg?.id ?? '').localeCompare(aMsg?.id ?? '');
    });

    return NextResponse.json(sortedDeals, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      },
    });
  } catch (error: unknown) {
    console.error('[INBOX_GET]', { organizationId, error });
    return NextResponse.json(
      { error: 'Не удалось загрузить список чатов' },
      { status: 500 },
    );
  }
}