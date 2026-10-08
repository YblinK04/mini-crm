
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchDealMessages,
  sendDealMessage,
  type MessageJSON,
} from './api';

export const messagesKeys = {
  all: ['messages'] as const,
  byDeal: (dealId: string) => [...messagesKeys.all, 'deal', dealId] as const,
} as const;

export const MESSAGES_QUERY_KEY = messagesKeys.all;

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Неизвестная ошибка';
}

const TEMP_ID_PREFIX = 'temp-';

function isTempId(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX);
}

export function useDealMessages(dealId: string) {
  const qc = useQueryClient();
  const queryKey = messagesKeys.byDeal(dealId);

  const send = useMutation({
    mutationFn: (text: string) => sendDealMessage(dealId, text),

    onMutate: async (text) => {
      await qc.cancelQueries({ queryKey });

      const previous = qc.getQueryData<MessageJSON[]>(queryKey);
      const tempId = `${TEMP_ID_PREFIX}${crypto.randomUUID()}`;
      const optimistic: MessageJSON = {
        id: tempId,
        direction: 'OUT',
        channel: 'TELEGRAM',
        content: text,
        createdAt: new Date().toISOString(),
      };

      qc.setQueryData<MessageJSON[]>(queryKey, (old = []) => [
        ...old,
        optimistic,
      ]);

      return { previous, tempId };
    },

    onSuccess: (serverMessage, _text, ctx) => {
      qc.setQueryData<MessageJSON[]>(queryKey, (old = []) =>
        old.map((m) => (m.id === ctx?.tempId ? serverMessage : m)),
      );
    },

    onError: (err, _text, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(queryKey, ctx.previous);
      }
      toast.error(errorMessage(err));
    },

    onSettled: () => {
     
      qc.invalidateQueries({ queryKey });
    },
  });

  const query = useQuery({
    queryKey,
    queryFn: () => fetchDealMessages(dealId),
    enabled: Boolean(dealId),
    refetchInterval: send.isPending ? false : 15_000,
  });

  return { ...query, send };
}