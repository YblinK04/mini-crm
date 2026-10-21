import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_CONTACTS = 200;

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;

  try {
    const contacts = await prisma.contact.findMany({
      where: { organizationId },
      orderBy: { firstName: 'asc' },
      take: MAX_CONTACTS,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        telegramUsername: true,
      },
    });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('[contacts GET]', { organizationId, error });
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 },
    );
  }
}