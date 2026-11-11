'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { moveDealToPipeline } from './api';
import { INBOX_DEALS_KEY, INBOX_COUNT_KEY } from './useInboxDeals';

interface MoveVariables {
  dealId: string;
  pipelineId: string;
}

export function useMoveDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, pipelineId }: MoveVariables) =>
      moveDealToPipeline(dealId, pipelineId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INBOX_DEALS_KEY });
      queryClient.invalidateQueries({ queryKey: INBOX_COUNT_KEY });
      toast.success(`Перемещено в «${data.pipeline.name}»`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}