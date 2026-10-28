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
  contacts: InboxContact[];
  messages: InboxMessage[];
}

export function useInbox() {
  const queryClient = useQueryClient();
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  const query = useQuery<InboxDeal[]>({
    queryKey: ['inbox'],
    queryFn: async () => {
      const res = await fetch('/api/inbox');
      if (!res.ok) {
        if (res.status === 401) throw new Error('unauthorized');
        throw new Error('server_error');
      }
      return res.json();
    },
    refetchInterval: 10_000,
    retry: (failureCount, err) => {
      if (err instanceof Error && err.message === 'unauthorized') return false;
      return failureCount < 2;
    },
  });

  const deals = query.data ?? [];

  useEffect(() => {
    if (deals.length === 0) return;
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;

    const stillExists =
      selectedDealId !== null && deals.some((d) => d.id === selectedDealId);

    if (!stillExists) {
      setSelectedDealId(deals[0].id);
    }
  }, [deals, selectedDealId]);

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
      const message =
        err instanceof Error ? err.message : 'Не удалось удалить диалог';
      toast.error(message);
    },
  });

  const selectedDeal = deals.find((d) => d.id === selectedDealId);

  return {
    ...query,
    deals,
    selectedDealId,
    setSelectedDealId,
    selectedDeal,
    deleteDeal: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}