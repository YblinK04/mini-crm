import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isPrismaNotFound } from '@/lib/errors';

const IdSchema = z.string().cuid();

const ActionSchema = z.object({
  action: z.enum(['archive', 'restore']),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;

  const { id } = await params;
  const idParsed = IdSchema.safeParse(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid deal id' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid action', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { action } = parsed.data;

  try {
    await prisma.deal.update({
      where: { id, organizationId },
      data: {
        archivedAt: action === 'archive' ? new Date() : null,
      },
    });

    return NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error: unknown) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json(
        { error: 'Сделка не найдена' },
        { status: 404 },
      );
    }

    console.error('[ARCHIVE_ERROR]', {
      dealId: id,
      organizationId,
      action,
      error,
    });

    return NextResponse.json(
      { error: 'Не удалось изменить статус архива' },
      { status: 500 },
    );
  }
}