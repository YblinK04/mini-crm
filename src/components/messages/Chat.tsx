'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TrainingLabel } from '@prisma/client';
import { Send, MessageSquare, Loader2, Globe, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDealMessages } from './useMessage';
import { useChatChannel, type OutChannel } from './useChatChannel';
import { MessageBubble } from './MessageBubble';

interface ChatProps {
  dealId: string;
  webToken?: string | null;
  hasTelegramContact?: boolean;
  className?: string;
}

const SCROLL_BOTTOM_THRESHOLD = 40;

export function Chat({
  dealId,
  webToken = null,
  hasTelegramContact = false,
  className,
}: ChatProps) {
  const { data: messages = [], isLoading, send } = useDealMessages(dealId);
  const [text, setText] = useState('');

  const {
    outChannel,
    setOutChannel,
    availableChannels,
    showChannelPicker,
    noChannelAvailable,
  } = useChatChannel(messages, hasTelegramContact, webToken);

  const isPending = send.isPending;
  const labelMutation = useMutation({
    mutationFn: async ({
      messageId,
      label,
    }: {
      messageId: string;
      label: TrainingLabel;
    }) => {
      const res = await fetch(`/api/messages/${messageId}/label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Не удалось сохранить метку');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Метка сохранена — модель обновится сразу');
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Не удалось сохранить метку';
      toast.error(message);
    },
  });

  const handleLabel = (messageId: string, label: TrainingLabel) => {
    labelMutation.mutate({ messageId, label });
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottomRef = useRef(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight <
      SCROLL_BOTTOM_THRESHOLD;
  };

  const lastId = messages[messages.length - 1]?.id;
  useEffect(() => {
    const el = scrollRef.current;
    if (el && isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [lastId]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isPending || !outChannel) return;

    setText('');
    try {
      await send.mutateAsync({ text: trimmed, channel: outChannel });
    } catch {
      setText((prev) => (prev.length > 0 ? prev : trimmed));
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const canSend = Boolean(text.trim()) && Boolean(outChannel);

  return (
    <div className={cn('flex flex-col w-full gap-2', className ?? 'h-[300px]')}>
      <div className="flex items-center justify-between gap-2 shrink-0">
        <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">
          Чат {messages.length > 0 && `(${messages.length})`}
        </span>

        {showChannelPicker && (
          <Select
            value={outChannel ?? ''}
            onValueChange={(v) => setOutChannel(v as OutChannel)}
          >
            <SelectTrigger
              className="h-7 w-auto gap-1 text-[11px] rounded-md px-2"
              aria-label="Выбор канала для ответа"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableChannels.includes('TELEGRAM') && (
                <SelectItem value="TELEGRAM">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="h-3 w-3" aria-hidden="true" />
                    Telegram
                  </span>
                </SelectItem>
              )}
              {availableChannels.includes('WEB') && (
                <SelectItem value="WEB">
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-3 w-3" aria-hidden="true" />
                    Веб-чат
                  </span>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-muted-foreground/15 bg-muted/10 p-3 space-y-2 scrollbar-thin"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            Загрузка...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-xs text-muted-foreground/60 gap-2">
            <MessageSquare className="w-6 h-6 opacity-40" aria-hidden="true" />
            <span>
              Сообщений пока нет.
              {noChannelAvailable
                ? ' Сгенерируйте ссылку на веб-чат или привяжите Telegram-контакт.'
                : ' Как только клиент напишет — они появятся здесь.'}
            </span>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              onLabel={handleLabel}
            />
          ))
        )}
      </div>

      <div className="flex items-end gap-2 shrink-0 pt-1">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            noChannelAvailable
              ? 'Нет активного канала для ответа'
              : 'Написать сообщение... (Enter — отправить)'
          }
          aria-label="Текст сообщения"
          rows={1}
          disabled={noChannelAvailable}
          className="min-h-[40px] max-h-[120px] flex-1 resize-none text-xs rounded-xl bg-background"
        />
        <Button
          type="button"
          size="icon"
          onClick={() => void handleSend()}
          disabled={!canSend}
          className="h-10 w-10 shrink-0 rounded-xl"
          aria-label="Отправить"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}