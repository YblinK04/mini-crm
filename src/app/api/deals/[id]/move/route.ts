import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { dealService } from '@/services/deal.service';

const MoveSchema = z.object({
  newStageId: z.string().cuid(),
  newOrder: z.number().int().nonnegative(),
  pipelineId: z.string().cuid(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: dealId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = MoveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const updated = await dealService.move(
      {
        dealId,
        newStageId: parsed.data.newStageId,
        newOrder: parsed.data.newOrder,
        pipelineId: parsed.data.pipelineId,
      },
      session.user.organizationId,
      session.user.id,
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('[DEAL_MOVE_ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Не удалось переместить сделку' },
      { status: 400 },
    );
  }
}