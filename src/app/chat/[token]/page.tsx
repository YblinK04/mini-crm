
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isPrismaNotFound } from '@/lib/errors';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId, id: userId } = session.user;
  const { id: dealId } = await params;

  try {
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId },
      select: { publicToken: true },
    });

    if (!deal) {
      return NextResponse.json(
        { error: 'Сделка не найдена' },
        { status: 404 },
      );
    }

    if (deal.publicToken) {
      return NextResponse.json(
        { token: deal.publicToken },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const newToken = randomBytes(32).toString('base64url');

    await prisma.deal.update({
      where: { id: dealId, organizationId },
      data: { publicToken: newToken },
    });

    try {
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId,
          action: 'DEAL_PUBLIC_TOKEN_CREATED',
          metadata: { dealId },
        },
      });
    } catch (auditError) {
      console.error('[TOKEN_AUDIT_FAILED]', auditError);
    }

    return NextResponse.json(
      { token: newToken },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error: unknown) {
    console.error('[GENERATE_TOKEN_ERROR]', {
      dealId,
      organizationId,
      error,
    });

    if (isPrismaNotFound(error)) {
      return NextResponse.json(
        { error: 'Сделка не найдена' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 },
    );
  }
}