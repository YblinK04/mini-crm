'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isChatMessage, TEMP_ID_PREFIX } from './utils';
import type { ChatData, ChatMessage } from './types';

const SCROLL_BOTTOM_THRESHOLD = 60;

export function usePublicChat(token: string) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['public-chat', token], [token]);

  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottomRef = useRef(true);

  

  const query = useQuery<ChatData>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/public/chat/${token}`);
      if (res.status === 404) throw new Error('not_found');
      if (!res.ok) throw new Error('server_error');
      return res.json();
    },
    refetchInterval: 5000,
    retry: false,
  });


  const send = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/public/chat/${token}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });
      if (!res.ok) throw new Error('send_failed');
      return (await res.json()) as unknown;
    },

    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ChatData>(queryKey);

      const optimistic: ChatMessage = {
        id: `${TEMP_ID_PREFIX}${crypto.randomUUID()}`,
        direction: 'IN',
        content,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ChatData>(queryKey, (old) =>
        old
          ? { ...old, messages: [...old.messages, optimistic] }
          : old,
      );

      return { previous, tempId: optimistic.id };
    },

    onSuccess: (rawServerMessage, _content, ctx) => {
      if (!isChatMessage(rawServerMessage)) {
        queryClient.invalidateQueries({ queryKey });
        return;
      }

      queryClient.setQueryData<ChatData>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m) =>
            m.id === ctx?.tempId ? rawServerMessage : m,
          ),
        };
      });
    },

    onError: (_err, _content, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toast.error('Не удалось отправить сообщение');
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
    query.data?.messages[query.data.messages.length - 1]?.id;

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
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    send.mutate(trimmed, {
      onError: () => {
        setText((prev) => (prev.length > 0 ? prev : trimmed));
      },
    });
  };

  return {
    ...query,
    send,
    text,
    setText,
    handleSend,
    scrollRef,
    textareaRef,
    handleScroll,
  };
}