'use client';

import { useCallback } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchTodayTasks,
  fetchTasksByDeal,
  fetchTasksByContact,
  createTask,
  updateTask,
  deleteTask,
  type CreateTaskPayload,
  type UpdateTaskPayload,
} from './api';


export interface ToggleTarget {
  id: string;
  completedAt: string | null;
}


export const TASKS_QUERY_KEY = ['tasks'] as const;

export const tasksKeys = {
  all: ['tasks'] as const,
  today: () => [...tasksKeys.all, 'today'] as const,
  byDeal: (dealId: string) => [...tasksKeys.all, 'deal', dealId] as const,
  byContact: (contactId: string) =>
    [...tasksKeys.all, 'contact', contactId] as const,
} as const;


function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Неизвестная ошибка';
}


function useTaskMutations() {
  const qc = useQueryClient();

  const invalidateAll = useCallback(
    () => qc.invalidateQueries({ queryKey: tasksKeys.all }),
    [qc],
  );

  const create = useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: () => {
      invalidateAll();
      toast.success('Задача создана');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      updateTask(id, payload),
    onSuccess: () => invalidateAll(),
    onError: (err) => toast.error(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      invalidateAll();
      toast.success('Задача удалена');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const toggleComplete = useCallback(
    (task: ToggleTarget) => {
      update.mutate({
        id: task.id,
        payload: {
          completedAt: task.completedAt ? null : new Date().toISOString(),
        },
      });
    },
    [update.mutate],
  );

  return { create, update, remove, toggleComplete };
}


export function useTodayTasks() {
  const query = useQuery({
    queryKey: tasksKeys.today(),
    queryFn: fetchTodayTasks,
    refetchInterval: 60_000,
  });

  const mutations = useTaskMutations();
  return { ...query, ...mutations };
}


export function useDealTasks(dealId: string) {
  const query = useQuery({
    queryKey: tasksKeys.byDeal(dealId),
    queryFn: () => fetchTasksByDeal(dealId),
    enabled: Boolean(dealId),
  });

  const mutations = useTaskMutations();
  return { ...query, ...mutations };
}


export function useContactTasks(contactId: string) {
  const query = useQuery({
    queryKey: tasksKeys.byContact(contactId),
    queryFn: () => fetchTasksByContact(contactId),
    enabled: Boolean(contactId),
  });

  const mutations = useTaskMutations();
  return { ...query, ...mutations };
}