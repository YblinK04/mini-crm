'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isChatMessage, TEMP_ID_PREFIX } from './utils';
import type { ActiveChatData, ChatMessage, ChatState } from './types';

const SCROLL_BOTTOM_THRESHOLD = 60;
const STATE_ERRORS = new Set(['blocked', 'closed', 'expired', 'not_found']);

export function usePublicChat(token: string) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['public-chat', token], [token]);

  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottomRef = useRef(true);

  const query = useQuery<ChatState>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/public/chat/${token}`);
      const data = (await res.json().catch(() => null)) as
        | ChatState
        | null;

      if (!data || typeof data.status !== 'string') {
        return { status: 'not_found' } satisfies ChatState;
      }

      return data;
    },
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (status === 'active') return 5_000;
      if (
        status === 'blocked' ||
        status === 'closed' ||
        status === 'expired'
      ) {
        return 60_000;
      }
      return false; 
    },
    retry: false,
  });

  const isActive = query.data?.status === 'active';

  const send = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/public/chat/${token}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });

      const data = (await res.json().catch(() => null)) as
        | Record<string, unknown>
        | null;

      if (!res.ok) {
        const status = (data?.status as string | undefined) ?? 'send_failed';
        throw new Error(status);
      }

      return data;
    },

    onMutate: async (content) => {
      if (!isActive) return undefined;

      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ChatState>(queryKey);

      const optimistic: ChatMessage = {
        id: `${TEMP_ID_PREFIX}${crypto.randomUUID()}`,
        direction: 'IN',
        content,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ChatState>(queryKey, (old) => {
        if (!old || old.status !== 'active') return old;
        return { ...old, messages: [...old.messages, optimistic] };
      });

      return { previous, tempId: optimistic.id };
    },

    onSuccess: (rawServerMessage, _content, ctx) => {
      if (!ctx) {
        queryClient.invalidateQueries({ queryKey });
        return;
      }

      if (!isChatMessage(rawServerMessage)) {
        queryClient.invalidateQueries({ queryKey });
        return;
      }

      queryClient.setQueryData<ChatState>(queryKey, (old) => {
        if (!old || old.status !== 'active') return old;
        return {
          ...old,
          messages: old.messages.map((m) =>
            m.id === ctx.tempId ? rawServerMessage : m,
          ),
        };
      });
    },

    onError: (err, _content, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }

      const code = err instanceof Error ? err.message : 'send_failed';

      if (STATE_ERRORS.has(code)) {
        queryClient.invalidateQueries({ queryKey });
        if (code === 'blocked') toast.error('Чат заблокирован менеджером');
        else if (code === 'closed') toast.error('Чат закрыт менеджером');
        else if (code === 'expired')
          toast.error('Срок действия ссылки истёк');
      } else {
        toast.error('Не удалось отправить сообщение');
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight <
      SCROLL_BOTTOM_THRESHOLD;
  };

  const lastMessageId =
    query.data?.status === 'active'
      ? query.data.messages[query.data.messages.length - 1]?.id
      : undefined;

  useEffect(() => {
    const el = scrollRef.current;
    if (el && isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [lastMessageId]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const handleSend = () => {
    if (!isActive) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    send.mutate(trimmed, {
      onError: () => {
        setText((prev) => (prev.length > 0 ? prev : trimmed));
      },
    });
  };

  const activeData: ActiveChatData | null = isActive
    ? (query.data as ActiveChatData)
    : null;

  return {
    ...query,
    activeData,
    isActive,
    send,
    text,
    setText,
    handleSend,
    scrollRef,
    textareaRef,
    handleScroll,
  };
}