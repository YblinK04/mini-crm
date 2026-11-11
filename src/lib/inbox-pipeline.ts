import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type InboxPipeline = Prisma.PipelineGetPayload<{
  include: { stages: true };
}>;

const INBOX_LOCK = new Map<string, Promise<InboxPipeline>>();

async function ensureStages(pipelineId: string, existingStagesCount: number) {
  if (existingStagesCount > 0) return;
  try {
    await prisma.stage.create({
      data: {
        pipelineId,
        name: 'Новые заявки',
        color: '#3b82f6',
        order: 0,
      },
    });
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') {
      throw e;
    }
  }
}

async function loadInbox(organizationId: string): Promise<InboxPipeline | null> {
  return prisma.pipeline.findFirst({
    where: { organizationId, isInbox: true },
    include: { stages: { orderBy: { order: 'asc' } } },
  });
}

async function createInbox(organizationId: string): Promise<InboxPipeline> {
  return prisma.pipeline.create({
    data: {
      name: 'Входящие',
      organizationId,
      isInbox: true,
      stages: {
        create: [{ name: 'Новые заявки', color: '#3b82f6', order: 0 }],
      },
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  });
}

async function getOrCreateInboxPipelineInner(
  organizationId: string,
): Promise<InboxPipeline> {
  const existing = await loadInbox(organizationId);

  if (existing) {
    if (existing.stages.length > 0) return existing;
    await ensureStages(existing.id, existing.stages.length);
    const refreshed = await prisma.pipeline.findUniqueOrThrow({
      where: { id: existing.id },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    return refreshed;
  }

  console.log(`📥 [INBOX] Создаём воронку "Входящие" для org ${organizationId}`);

  try {
    return await createInbox(organizationId);
  } catch (e) {
   
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      const fallback = await loadInbox(organizationId);
      if (!fallback) throw e;
      if (fallback.stages.length === 0) {
        await ensureStages(fallback.id, 0);
        return prisma.pipeline.findUniqueOrThrow({
          where: { id: fallback.id },
          include: { stages: { orderBy: { order: 'asc' } } },
        });
      }
      return fallback;
    }
    throw e;
  }
}

export async function getOrCreateInboxPipeline(
  organizationId: string,
): Promise<InboxPipeline> {
  const inflight = INBOX_LOCK.get(organizationId);
  if (inflight) return inflight;

  const promise = getOrCreateInboxPipelineInner(organizationId).finally(() => {
    INBOX_LOCK.delete(organizationId);
  });

  INBOX_LOCK.set(organizationId, promise);
  return promise;
}