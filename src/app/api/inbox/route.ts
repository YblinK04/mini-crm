
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_DEALS = 100;

export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');

  if (view !== null && view !== 'archive') {
    return NextResponse.json(
      { error: 'Invalid view. Use "archive" or omit.' },
      { status: 422 },
    );
  }

  const whereClause =
    view === 'archive'
      ? { archivedAt: { not: null } }
      : { archivedAt: null };

  try {
    const deals = await prisma.deal.findMany({
      where: {
        organizationId,
        messages: { some: {} },
        ...whereClause,
      },
      select: {
        id: true,
        title: true,
        publicToken: true,    
        archivedAt: true,     
        contacts: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: {
            firstName: true,
            lastName: true,
            telegramChatId: true,
          },
        },
        messages: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
      take: MAX_DEALS,
    });

    const sortedDeals = [...deals].sort((a, b) => {
      const dateA = a.messages[0]?.createdAt.getTime() || 0;
      const dateB = b.messages[0]?.createdAt.getTime() || 0;
      if (dateA !== dateB) return dateB - dateA;
      return b.id.localeCompare(a.id);
    });

    return NextResponse.json(sortedDeals, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      },
    });
  } catch (error: unknown) {
    console.error('[INBOX_GET]', { organizationId, view, error });
    return NextResponse.json(
      { error: 'Не удалось загрузить чаты' },
      { status: 500 },
    );
  }
}