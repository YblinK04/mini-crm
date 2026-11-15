import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ActionSchema = z.object({
  action: z.enum(['block', 'unblock']),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = ActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'action должен быть "block" или "unblock"' },
      { status: 422 },
    );
  }

  const { action } = parsed.data;
  const organizationId = session.user.organizationId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.contact.updateMany({
        where: { id, organizationId },
        data: { blockedAt: action === 'block' ? new Date() : null },
      });

      if (updateResult.count === 0) {
        return { found: false as const };
      }

      if (action === 'block') {
        await tx.deal.updateMany({
          where: {
            organizationId,
            contacts: { some: { id } },
            chatClosedAt: null,
          },
          data: { chatClosedAt: new Date() },
        });
      }

      return { found: true as const };
    });

    if (!result.found) {
      return NextResponse.json(
        { error: 'Контакт не найден' },
        { status: 404 },
      );
    }

    prisma.auditLog
      .create({
        data: {
          organizationId,
          userId: session.user.id,
          action:
            action === 'block' ? 'CONTACT_BLOCKED' : 'CONTACT_UNBLOCKED',
          metadata: { contactId: id },
        },
      })
      .catch((e) => console.error('[CONTACT_BLOCK_AUDIT]', e));

    return NextResponse.json({ ok: true, action });
  } catch (error) {
    console.error('[CONTACT_BLOCK_ERROR]', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}