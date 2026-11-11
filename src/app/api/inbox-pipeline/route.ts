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
        archivedAt: null,
        pipeline: { isInbox: true },
      },
      include: {
        contacts: {
          take: 1,
          select: { firstName: true, lastName: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(deals);
  } catch (error) {
    console.error('[INBOX_PIPELINE_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}