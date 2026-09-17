'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDealStore } from '@/store/useDealStore';
import { toast } from 'sonner';

export interface CreateStagePayload { name: string; color?: string; }
export interface UpdateStagePayload { stageId: string; name: string; color: string; }

export function useStageMutations(pipelineId: string) {
  const queryClient = useQueryClient();

  const createStage = useMutation({
    mutationKey: ['stages', 'create', pipelineId],
    mutationFn: async (data: CreateStagePayload) => {
      const response = await fetch(`/api/pipelines/${pipelineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_STAGE', name: data.name.trim(), color: data.color }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Не удалось создать колонку воронки');
      }
      return response.json();
    },
    onSuccess: async (newStageFromServer) => {
      toast.success('Новый этап успешно добавлен на доску');
      const currentStages = useDealStore.getState().stages || [];
      const reactiveStage = {
        ...newStageFromServer,
        totalBudget: 0, 
        deals: newStageFromServer.deals || []       
      };
      useDealStore.setState({ stages: [...currentStages, reactiveStage] });
      await queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateStage = useMutation({
    mutationKey: ['stages', 'update', pipelineId],
    mutationFn: async (data: UpdateStagePayload) => {
      const response = await fetch(`/api/pipelines/${pipelineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_STAGE', stageId: data.stageId, name: data.name.trim(), color: data.color }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Не удалось сохранить изменения этапа');
      }
      return response.json();
    },
    onSuccess: async (updatedStage) => {
      toast.success('Параметры этапа успешно сохранены');
      const currentStages = useDealStore.getState().stages || [];
      const nextStages = currentStages.map((s) => s.id === updatedStage.id ? { ...s, name: updatedStage.name, color: updatedStage.color } : s);
      useDealStore.setState({ stages: nextStages });
      await queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteStage = useMutation({
    mutationKey: ['stages', 'delete', pipelineId],
    mutationFn: async (stageId: string) => {
      const response = await fetch(`/api/pipelines/${pipelineId}?stageId=${stageId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Не удалось удалить этап воронки');
      }
      return response.json();
    },
    onSuccess: async (_, deletedStageId) => {
      toast.success('Этап воронки навсегда удален с доски');
      const currentStages = useDealStore.getState().stages || [];
      const filteredStages = currentStages.filter((s) => s.id !== deletedStageId).map((s, idx) => ({ ...s, order: idx }));
      useDealStore.setState({ stages: filteredStages });
      await queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { createStage, updateStage, deleteStage };
}
