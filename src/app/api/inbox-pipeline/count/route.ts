import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const count = await prisma.deal.count({
      where: {
        organizationId: session.user.organizationId,
        archivedAt: null,
        pipeline: { isInbox: true },
      },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}