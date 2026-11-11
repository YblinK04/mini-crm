import { events } from '@/lib/events';
import { prisma } from '@/lib/prisma';

interface StageChangedPayload {
  deal: {
    id: string;
    title: string;
    stageId: string;
    organizationId: string;
  };
  oldStageId: string;
  newStageId: string;
  organizationId: string;
  userId: string;
}

declare global {
  var __autoTaskOnStageRegistered: boolean | undefined;
}

export function registerAutoTaskOnStage() {
  if (globalThis.__autoTaskOnStageRegistered) return;
  globalThis.__autoTaskOnStageRegistered = true;

  console.log('🔔 [AUTO_TASK] Подписка на deal.stageChanged зарегистрирована');

  events.on<StageChangedPayload>('deal.stageChanged', async (payload) => {
    const { deal, oldStageId, newStageId, organizationId, userId } = payload;

    try {
      if (!newStageId) return;

      if (oldStageId === newStageId) return;

      const stage = await prisma.stage.findUnique({
        where: { id: newStageId },
        select: {
          name: true,
          autoTaskTitle: true,
          autoTaskDays: true,
        },
      });

      if (!stage?.autoTaskTitle || stage.autoTaskDays == null) return;
      if (!userId) {
        console.warn('[AUTO_TASK] userId пустой — пропускаем');
        return;
      }
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + stage.autoTaskDays);

      const task = await prisma.task.create({
        data: {
          organizationId,
          dealId: deal.id,
          title: stage.autoTaskTitle,
          description: `Автозадача: сделка перешла в этап "${stage.name}"`,
          dueAt,
          createdById: userId,
        },
      });

      console.log(
        `✅ [AUTO_TASK] Задача "${stage.autoTaskTitle}" создана: ${task.id}`,
      );
    } catch (error) {
      console.error('❌ [AUTO_TASK_ERROR]', error);
    }
  });
}