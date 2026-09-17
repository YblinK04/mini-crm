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

interface QueryContext {
  previousPipelineData?: unknown;
}

export function useKanbanDnd(pipelineId: string) {
  const queryClient = useQueryClient();
  
  const stages = useDealStore((state) => state.stages);
  const moveDealOptimistic = useDealStore((state) => state.moveDealOptimistic);
  const rollbackOptimisticAction = useDealStore((state) => state.rollbackOptimisticAction);
  const clearBackup = useDealStore((state) => state.clearBackup);

  const { mutate: moveDealOnServer } = useMutation<unknown, Error, MutationPayload, QueryContext>({
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
        throw new Error(`Сервер отклонил сохранение позиции. Статус: ${response.status}`);
      }
      return response.json();
    },
    onMutate: async () => {
      const queryKey = ['pipeline', pipelineId];
      await queryClient.cancelQueries({ queryKey });
      const previousPipelineData = queryClient.getQueryData(queryKey);
      return { previousPipelineData };
    },
    onSuccess: () => {
      clearBackup();
    },
    onError: (error, payload, context) => {
      rollbackOptimisticAction(); 
      if (context?.previousPipelineData) {
        queryClient.setQueryData(['pipeline', pipelineId], context.previousPipelineData);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
    }
  });

  const handleDragOver = useCallback((event: DragOverEvent) => {
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

    if (fromStageId === toStageId && currentOrder === newOrder) {
      return;
    }

    moveDealOptimistic({ dealId, fromStageId, toStageId, newOrder });
  }, [stages, moveDealOptimistic]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      rollbackOptimisticAction();
      return;
    }

    const dealId = active.id as string;
    const overId = over.id as string;
    
    const initialStageId = active.data.current?.stageId as string | undefined;
    const initialOrder = active.data.current?.index as number | undefined;

    const isOverATask = Boolean(over.data.current?.stageId);
    const finalStageId = (over.data.current?.stageId || overId) as string;
    let finalOrder = 0;

    if (isOverATask) {
      finalOrder = over.data.current?.index ?? 0;
    } else {
      const targetStage = stages.find((s) => s.id === finalStageId);
      finalOrder = targetStage ? targetStage.deals.length : 0;
    }

    if (!initialStageId || !finalStageId) {
      rollbackOptimisticAction();
      return;
    }

    if (initialStageId === finalStageId && initialOrder === finalOrder) {
      return; 
    }

    moveDealOnServer({
      dealId,    
      newStageId: finalStageId,
      newOrder: finalOrder,
      pipelineId,
    });
  }, [stages, pipelineId, rollbackOptimisticAction, moveDealOnServer]);

  return { handleDragOver, handleDragEnd };
}
