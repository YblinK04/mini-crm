'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';


interface ChatMessage {
  id: string;
  direction: 'IN' | 'OUT';
  content: string;
  createdAt: string;
}

interface ChatData {
  organization: { name: string };
  title: string;
  messages: ChatMessage[];
}

const TEMP_ID_PREFIX = 'temp-';
const SCROLL_BOTTOM_THRESHOLD = 60;

export function PublicChat({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['public-chat', token], [token]);

  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottomRef = useRef(true);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ChatData>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/public/chat/${token}`);
      if (res.status === 404) {
        throw new Error('not_found');
      }
      if (!res.ok) {
        throw new Error('server_error');
      }
      return res.json();
    },
    refetchInterval: 5000,
    retry: false,
  });


  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/public/chat/${token}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });
      if (!res.ok) throw new Error('send_failed');
      return (await res.json()) as ChatMessage;
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

    onSuccess: (serverMessage, _content, ctx) => {
      queryClient.setQueryData<ChatData>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m) =>
            m.id === ctx?.tempId ? serverMessage : m,
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


  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    sendMessage.mutate(trimmed, {
      onError: () => {
        setText((prev) => (prev.length > 0 ? prev : trimmed));
      },
    });
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight <
      SCROLL_BOTTOM_THRESHOLD;
  };

  const lastMessageId = data?.messages[data.messages.length - 1]?.id;

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


  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label="Загрузка"
        />
      </div>
    );
  }

  if (isError || !data) {
    const reason = error instanceof Error ? error.message : '';
    const isNotFound = reason === 'not_found';

    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground p-6 text-center">
        <MessageSquare
          className="h-10 w-10 mb-4 opacity-20"
          aria-hidden="true"
        />
        {isNotFound ? (
          <>
            <p>Чат не найден или ссылка устарела.</p>
            <p className="text-xs mt-2 opacity-50">
              Попросите менеджера создать новую ссылку.
            </p>
          </>
        ) : (
          <>
            <p>Не удалось загрузить чат.</p>
            <p className="text-xs mt-2 opacity-50">
              Проверьте соединение и попробуйте снова.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => refetch()}
            >
              Повторить
            </Button>
          </>
        )}
      </div>
    );
  }


  return (
    <>
      <header className="flex items-center justify-center px-4 py-4 border-b bg-card shrink-0 shadow-sm z-10">
        <div className="text-center">
          <h1 className="text-sm font-bold">
            {data.organization?.name ?? 'Чат'}
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
            {data.title}
          </p>
        </div>
      </header>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
      >
        {data.messages.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground mt-10">
            Напишите ваше первое сообщение...
          </div>
        ) : (
          data.messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))
        )}
      </div>

      <div className="p-3 bg-card border-t shrink-0">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Сообщение..."
            aria-label="Текст сообщения"
            className="min-h-[44px] max-h-[120px] resize-none text-sm rounded-xl bg-muted/30 border-none focus-visible:ring-1"
            rows={1}
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={!text.trim()}
            size="icon"
            className="h-[44px] w-[44px] shrink-0 rounded-xl"
            aria-label="Отправить сообщение"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}


function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isIncoming = msg.direction === 'IN';
  const isTemp = msg.id.startsWith(TEMP_ID_PREFIX);

  const time = (() => {
    const d = new Date(msg.createdAt);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  })();

  return (
    <div
      className={cn(
        'flex flex-col max-w-[85%]',
        isIncoming ? 'items-end ml-auto' : 'items-start',
      )}
    >
      <div
        className={cn(
          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm',
          isIncoming
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground border border-border/50 rounded-bl-sm',
          isTemp && 'opacity-60',
        )}
      >
        {msg.content}
      </div>
      {time && (
        <span className="text-[9px] text-muted-foreground mt-1 px-1 tabular-nums">
          {time}
        </span>
      )}
    </div>
  );
}