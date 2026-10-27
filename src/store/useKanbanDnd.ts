'use client';

import { DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { useCallback } from 'react';
import { useDealStore } from './useDealStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface MutationPayload {
  dealId: string;
  newStageId: string;
  newOrder: number;
  pipelineId: string;
}

export function useKanbanDnd(pipelineId: string) {
  const queryClient = useQueryClient();
  const stages = useDealStore((state) => state.stages);
  const moveDealOptimistic = useDealStore((state) => state.moveDealOptimistic);
  const rollbackOptimisticAction = useDealStore((state) => state.rollbackOptimisticAction);
  const clearBackup = useDealStore((state) => state.clearBackup);

  const { mutate: moveDealOnServer } = useMutation<unknown, Error, MutationPayload>({
    mutationKey: ['pipeline', 'move', pipelineId],
    mutationFn: async (payload) => {
      const response = await fetch(`/api/deals/${payload.dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: payload.newStageId,
          order: payload.newOrder,
        }),
      });
      if (!response.ok) {
        throw new Error(`Сервер отклонил сохранение. Статус: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      clearBackup();
    },
    onError: (error) => {
      console.error('[KANBAN_DND_ERROR]', error);
      rollbackOptimisticAction();
    },
  });

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      try {
        const { active, over } = event;
        if (!over) return;

        const dealId = active.id as string;
        const overId = over.id as string;

        const fromStageId = active.data.current?.stageId as string | undefined;
        const toStageId = (over.data.current?.stageId || overId) as string;

        if (!fromStageId || !toStageId) return;

        const isOverATask = Boolean(over.data.current?.stageId);
        let newOrder = 0;

        if (isOverATask) {
          newOrder = over.data.current?.index ?? 0;
        } else {
          const targetStage = stages.find((s) => s.id === toStageId);
          newOrder = targetStage ? targetStage.deals.length : 0;
        }

        const currentOrder = active.data.current?.index as number | undefined;
        if (fromStageId === toStageId && currentOrder === newOrder) return;

        moveDealOptimistic({ dealId, fromStageId, toStageId, newOrder });
      } catch (err) {
        console.error('[DRAG_OVER_ERROR]', err);
      }
    },
    [stages, moveDealOptimistic],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      try {
        const { active, over } = event;

        if (!over) {
          rollbackOptimisticAction();
          return;
        }

        const dealId = active.id as string;

        let movedStageId: string | null = null;
        let movedOrder: number | null = null;

        for (const stage of stages) {
          const foundDeal = stage.deals.find((d) => d.id === dealId);
          if (foundDeal) {
            movedStageId = stage.id;
            movedOrder = foundDeal.order;
            break;
          }
        }

        if (movedStageId === null || movedOrder === null) {
          rollbackOptimisticAction();
          return;
        }

        moveDealOnServer({
          dealId,
          newStageId: movedStageId,
          newOrder: movedOrder,
          pipelineId,
        });
      } catch (err) {
        console.error('[DRAG_END_ERROR]', err);
        rollbackOptimisticAction();
      }
    },
    [stages, pipelineId, rollbackOptimisticAction, moveDealOnServer],
  );

  return { handleDragOver, handleDragEnd };
}