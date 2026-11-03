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

const g = globalThis as typeof globalThis & {
  __stageChangedTaskRegistered?: boolean;
};

export function registerStageChangedTask() {
  if (g.__stageChangedTaskRegistered) return;
  g.__stageChangedTaskRegistered = true;

  console.log('🔔 [AUTO_TASK] Подписка на deal.stageChanged зарегистрирована');

  events.on<StageChangedPayload>('deal.stageChanged', async (payload) => {
    const { deal, newStageId, organizationId, userId } = payload;

    console.log('🎯 [AUTO_TASK] Событие получено:', {
      dealId: deal.id,
      newStageId,
      userId,
      organizationId,
    });

    try {
      if (!newStageId) {
        console.log('❌ [AUTO_TASK] newStageId пустой');
        return;
      }

      const stage = await prisma.stage.findUnique({
        where: { id: newStageId },
        select: {
          name: true,
          autoTaskTitle: true,
          autoTaskDays: true,
        },
      });

      console.log('📋 [AUTO_TASK] Этап из БД:', stage);

      if (!stage) {
        console.log('❌ [AUTO_TASK] Этап не найден в БД');
        return;
      }
      if (!stage.autoTaskTitle) {
        console.log('❌ [AUTO_TASK] autoTaskTitle = null');
        return;
      }
      if (stage.autoTaskDays == null) {
        console.log('❌ [AUTO_TASK] autoTaskDays = null');
        return;
      }
      if (!userId) {
        console.log('❌ [AUTO_TASK] userId пустой');
        return;
      }

      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + stage.autoTaskDays);
      dueAt.setHours(10, 0, 0, 0);

      console.log('📅 [AUTO_TASK] Создаём задачу на:', dueAt);

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

      console.log('✅ [AUTO_TASK] Задача создана:', {
        id: task.id,
        title: task.title,
      });
    } catch (error) {
      console.error('❌ [AUTO_TASK_ERROR]', error);
    }
  });
}