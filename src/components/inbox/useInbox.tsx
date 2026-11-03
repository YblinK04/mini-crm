'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface InboxContact {
  firstName: string;
  lastName: string | null;
  telegramChatId: string | null;
}

export interface InboxMessage {
  id: string;
  content: string;
  direction: 'IN' | 'OUT';
  channel: string;
  createdAt: string;
}

export interface InboxDeal {
  id: string;
  title: string;
  publicToken: string | null;
  archivedAt: string | null;
  contacts: InboxContact[];
  messages: InboxMessage[];
}

export type InboxView = 'active' | 'archive';

export function useInbox() {
  const queryClient = useQueryClient();
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [view, setView] = useState<InboxView>('active');
  const query = useQuery<InboxDeal[]>({
    queryKey: ['inbox', view],
    queryFn: async () => {
      const res = await fetch(
        `/api/inbox${view === 'archive' ? '?view=archive' : ''}`,
      );
      if (!res.ok) {
        if (res.status === 401) throw new Error('unauthorized');
        throw new Error('server_error');
      }
      return res.json();
    },
    refetchInterval: view === 'active' ? 10_000 : false,
    retry: (failureCount, err) => {
      if (err instanceof Error && err.message === 'unauthorized') return false;
      return failureCount < 2;
    },
  });

  const deals = query.data ?? [];

  useEffect(() => {
    setSelectedDealId(null);
  }, [view]);

  useEffect(() => {
    if (view !== 'active' && view !== 'archive') return;
    if (deals.length === 0) return;
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;

    const stillExists =
      selectedDealId !== null && deals.some((d) => d.id === selectedDealId);

    if (!stillExists) {
      setSelectedDealId(deals[0].id);
    }
  }, [deals, selectedDealId, view]);

  const deleteMutation = useMutation({
    mutationFn: async (dealId: string) => {
      const res = await fetch(`/api/deals/${dealId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Не удалось удалить диалог');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Диалог удалён');
      setSelectedDealId(null);
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Не удалось удалить');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: 'archive' | 'restore';
    }) => {
      const res = await fetch(`/api/deals/${id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Не удалось изменить статус архива');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === 'archive'
          ? 'Диалог отправлен в архив'
          : 'Диалог восстановлен',
      );
      setSelectedDealId(null);
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof Error ? err.message : 'Не удалось изменить статус',
      );
    },
  });

  const selectedDeal = deals.find((d) => d.id === selectedDealId);

  return {
    ...query,
    deals,
    view,
    setView,
    selectedDealId,
    setSelectedDealId,
    selectedDeal,
    deleteDeal: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    archiveDeal: archiveMutation.mutate,
    isArchiving: archiveMutation.isPending,
  };
}