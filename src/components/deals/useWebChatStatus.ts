'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { WebChatStatus } from './types';

export function useWebChatStatus(
  dealId: string | null | undefined,
  enabled: boolean,
) {
  const qc = useQueryClient();

  const query = useQuery<WebChatStatus>({
    queryKey: ['deal', dealId, 'web-chat'],
    queryFn: async () => {
      const res = await fetch(`/api/deals/${dealId}/token`);
      if (!res.ok) throw new Error('Не удалось загрузить статус');
      return res.json();
    },
    enabled: enabled && Boolean(dealId),
  });

  const invalidate = useCallback(() => {
    if (!dealId) return;
    qc.invalidateQueries({ queryKey: ['deal', dealId, 'web-chat'] });
  }, [qc, dealId]);

  return { ...query, invalidate };
}