'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDealStore, KanbanDeal } from '@/store/useDealStore';
import { toast } from 'sonner';

function generateClientUid(): string {
  const cryptoRef = typeof window !== 'undefined' ? window.crypto : null;
  if (cryptoRef && cryptoRef.randomUUID) {
    return `client-${cryptoRef.randomUUID()}`;
  }
  return `client-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
}

export interface CreateDealPayload { 
  title: string; 
  budget: number; 
  stageId: string; 
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'; 
  customFields?: Record<string, string>; 
}

export interface UpdateDealPayload { 
  id: string; 
  title?: string; 
  description?: string | null; 
  budget?: number; 
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'; 
  stageId?: string; 
  pipelineId?: string; 
  companyId?: string | null; 
  contactIds?: string[];   
  customFields?: Record<string, string>; 
}

export interface DeleteDealPayload { 
  stageId: string; 
  dealId: string; 
}

export function useDealMutations(pipelineId: string) {
  const queryClient = useQueryClient();
  
  const addDealOptimistic = useDealStore((state) => state.addDealOptimistic);
  const updateDealOptimistic = useDealStore((state) => state.updateDealOptimistic);
  const deleteDealOptimistic = useDealStore((state) => state.deleteDealOptimistic);
  const rollbackOptimisticAction = useDealStore((state) => state.rollbackOptimisticAction);
  const updateDealIdInState = useDealStore((state) => state.updateDealIdInState);

  const invalidateBoard = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
  };

  const createDeal = useMutation({
    mutationKey: ['deals', 'create', pipelineId],
    mutationFn: async (data: CreateDealPayload) => {
      const response = await fetch('/api/deals', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...data, pipelineId }) 
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Не удалось создать сделку');
      }
      return response.json();
    },
    onMutate: async (variables: CreateDealPayload) => {
      const queryKey = ['pipeline', pipelineId];
      await queryClient.cancelQueries({ queryKey });
      
      const previousPipelineData = queryClient.getQueryData(queryKey);
      const temporaryId = generateClientUid();
      
      const tempDeal: KanbanDeal = { 
        id: temporaryId, 
        title: variables.title.trim(), 
        budget: variables.budget, 
        stageId: variables.stageId, 
        pipelineId, 
        description: null, 
        priority: variables.priority || 'MEDIUM', 
        order: 999, 
        closeDate: null, 
        createdAt: new Date(), 
        updatedAt: new Date(), 
        organizationId: 'current-tenant', 
        customFields: variables.customFields || {}, 
        assigneeId: null, 
        companyId: null, 
        company: null, 
        contacts: [], 
        assignee: null 
      };
      
      addDealOptimistic(variables.stageId, tempDeal);
      
      return { previousPipelineData, temporaryId };
    },
    onSuccess: (serverData, variables, context) => {
      toast.success('Сделка успешно добавлена');
      
      if (context?.temporaryId && serverData?.id) {
        updateDealIdInState(context.temporaryId, serverData.id);
      }
    },
    onError: (error: Error, variables, context) => { 
      rollbackOptimisticAction(); 
      if (context?.previousPipelineData) {
        queryClient.setQueryData(['pipeline', pipelineId], context.previousPipelineData);
      }
      toast.error(error.message); 
    },
    onSettled: () => { void invalidateBoard(); },
  });

  const updateDeal = useMutation({
    mutationKey: ['deals', 'update', pipelineId],
    mutationFn: async (data: UpdateDealPayload) => {
      const response = await fetch(`/api/deals/${data.id}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Ошибка обновления данных');
      }
      return response.json();
    },
    onMutate: async (variables: UpdateDealPayload) => {
      const queryKey = ['pipeline', pipelineId];
      await queryClient.cancelQueries({ queryKey });
      
      const previousPipelineData = queryClient.getQueryData(queryKey);
      const { id, ...fieldsToUpdate } = variables;
      
      updateDealOptimistic(id, fieldsToUpdate as Partial<KanbanDeal>);
      
      return { previousPipelineData };
    },
    onSuccess: () => toast.success('Карточка обновлена'),
    onError: (error: Error, variables, context) => { 
      rollbackOptimisticAction(); 
      if (context?.previousPipelineData) {
        queryClient.setQueryData(['pipeline', pipelineId], context.previousPipelineData);
      }
      toast.error(error.message); 
    },
    onSettled: () => { void invalidateBoard(); },
  });

  const deleteDeal = useMutation({
    mutationKey: ['deals', 'delete', pipelineId],
    mutationFn: async (payload: DeleteDealPayload) => {
      const response = await fetch(`/api/deals/${payload.dealId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.status === 404) {
        return { isAlreadyDeleted: true };
      }
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Не удалось удалить сделку');
      }
      return response.json();
    },
    onMutate: async (variables: DeleteDealPayload) => {
      const queryKey = ['pipeline', pipelineId];
      await queryClient.cancelQueries({ queryKey });
      
      const previousPipelineData = queryClient.getQueryData(queryKey);
      
      deleteDealOptimistic(variables.stageId, variables.dealId);
      
      return { previousPipelineData };
    },
    onSuccess: (data) => {
      if (data && (data as any).isAlreadyDeleted) {
        toast.warning('Сделка уже удалена или доступ ограничен. UI синхронизирован.');
      } else {
        toast.success('Сделка удалена');
      }
    },
    onError: (error: Error, variables, context) => { 
      rollbackOptimisticAction(); 
      if (context?.previousPipelineData) {
        queryClient.setQueryData(['pipeline', pipelineId], context.previousPipelineData);
      }
      toast.error(error.message); 
    },
    onSettled: () => { void invalidateBoard(); },
  });

  return { createDeal, updateDeal, deleteDeal };
}
