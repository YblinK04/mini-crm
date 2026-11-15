'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { INBOX_DEALS_KEY, INBOX_COUNT_KEY } from './useInboxDeals';

interface DeleteVariables {
  dealId: string;
  blockContact: boolean;
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dealId, blockContact }: DeleteVariables) => {
      const url = blockContact
        ? `/api/deals/${dealId}?block=true`
        : `/api/deals/${dealId}`;

      const res = await fetch(url, { method: 'DELETE' });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error || 'Не удалось удалить сделку',
        );
      }

      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: INBOX_DEALS_KEY });
      queryClient.invalidateQueries({ queryKey: INBOX_COUNT_KEY });
      toast.success(
        variables.blockContact
          ? 'Сделка удалена, контакт заблокирован'
          : 'Сделка удалена',
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });
}