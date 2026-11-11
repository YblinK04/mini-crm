import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { events } from '@/lib/events';

const MoveSchema = z.object({
  pipelineId: z.string().cuid(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: dealId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = MoveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Некорректный pipelineId' }, { status: 422 });
  }

  try {
    const [deal, targetPipeline] = await Promise.all([
      prisma.deal.findFirst({
        where: { id: dealId, organizationId: session.user.organizationId },
        select: { id: true, title: true, stageId: true },
      }),
      prisma.pipeline.findFirst({
        where: {
          id: parsed.data.pipelineId,
          organizationId: session.user.organizationId,
        },
        include: {
          stages: { orderBy: { order: 'asc' }, take: 1 },
        },
      }),
    ]);

    if (!deal) {
      return NextResponse.json({ error: 'Сделка не найдена' }, { status: 404 });
    }
    if (!targetPipeline || targetPipeline.stages.length === 0) {
      return NextResponse.json({ error: 'Воронка не найдена или пуста' }, { status: 404 });
    }

    const firstStage = targetPipeline.stages[0];
    const oldStageId = deal.stageId;

    const updated = await prisma.deal.update({
      where: { id: dealId },
      data: {
        pipelineId: targetPipeline.id,
        stageId: firstStage.id,
      },
    });

    try {
      await events.emit('deal.stageChanged', {
        deal: {
          id: updated.id,
          title: updated.title,
          stageId: updated.stageId,
          organizationId: updated.organizationId,
        },
        oldStageId,
        newStageId: firstStage.id,
        organizationId: session.user.organizationId,
        userId: session.user.id,
      });
    } catch (err) {
      console.error('[MOVE_PIPELINE_EMIT_ERROR]', err);
    }

    return NextResponse.json({
      ok: true,
      pipeline: { id: targetPipeline.id, name: targetPipeline.name },
    });
  } catch (error) {
    console.error('[MOVE_TO_PIPELINE_ERROR]', error);
    return NextResponse.json({ error: 'Не удалось переместить' }, { status: 500 });
  }
}