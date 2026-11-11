import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pipelines = await prisma.pipeline.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: 'asc' },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          select: { id: true, name: true, color: true, order: true },
        },
      },
    });

    return NextResponse.json(pipelines);
  } catch (error) {
    console.error('[PIPELINES_WITH_STAGES_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}