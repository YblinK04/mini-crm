import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isPrismaNotFound } from '@/lib/errors';


export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;
  const { id: dealId } = await params;

  try {
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId },
      select: {
        publicToken: true,
        publicTokenExpiresAt: true,
        contacts: {
          where: { telegramChatId: { not: null } },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!deal) {
      return NextResponse.json(
        { error: 'Сделка не найдена' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      token: deal.publicToken,
      expiresAt: deal.publicTokenExpiresAt,
      hasTelegramContact: deal.contacts.length > 0,
    });
  } catch (error: unknown) {
    console.error('[TOKEN_STATUS_ERROR]', { dealId, organizationId, error });
    return NextResponse.json(
      { error: 'Не удалось получить статус' },
      { status: 500 },
    );
  }
}


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
    console.error('[GENERATE_TOKEN_ERROR]', { dealId, organizationId, error });
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


export async function DELETE(
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
    await prisma.deal.update({
      where: { id: dealId, organizationId },
      data: { publicToken: null, publicTokenExpiresAt: null },
    });

    try {
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId,
          action: 'DEAL_PUBLIC_TOKEN_REVOKED',
          metadata: { dealId },
        },
      });
    } catch (auditError) {
      console.error('[TOKEN_AUDIT_REVOKE_FAILED]', auditError);
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json(
        { error: 'Сделка не найдена' },
        { status: 404 },
      );
    }
    console.error('[REVOKE_TOKEN_ERROR]', { dealId, organizationId, error });
    return NextResponse.json(
      { error: 'Не удалось отозвать ссылку' },
      { status: 500 },
    );
  }
}