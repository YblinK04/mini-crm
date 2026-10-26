'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
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
import type { MessageJSON } from './api';

interface ChatProps {
  dealId: string;
  webToken?: string | null;
  hasTelegramContact?: boolean;
}

const LOCALE = 'ru-RU';
const SCROLL_BOTTOM_THRESHOLD = 40;

type OutChannel = 'TELEGRAM' | 'WEB';

function formatTime(createdAt: string): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '';

  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const time = d.toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) return time;

  return (
    d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' }) +
    ', ' +
    time
  );
}

export function Chat({
  dealId,
  webToken = null,
  hasTelegramContact = false,
}: ChatProps) {
  const { data: messages = [], isLoading, send } = useDealMessages(dealId);

  const [text, setText] = useState('');

  const lastIncoming = useMemo(
    () => [...messages].reverse().find((m) => m.direction === 'IN'),
    [messages],
  );

  const lastIncomingChannel: OutChannel | null =
    lastIncoming?.channel === 'WEB'
      ? 'WEB'
      : lastIncoming?.channel === 'TELEGRAM' || lastIncoming?.channel === 'MAX'
        ? 'TELEGRAM'
        : null;

  const initialChannel: OutChannel | null =
    lastIncomingChannel ??
    (hasTelegramContact ? 'TELEGRAM' : webToken ? 'WEB' : null);

  const [outChannel, setOutChannel] = useState<OutChannel | null>(
    initialChannel,
  );

  useEffect(() => {
    setOutChannel((current) => {
      if (current === 'TELEGRAM' && !hasTelegramContact) {
        return webToken ? 'WEB' : null;
      }
      if (current === 'WEB' && !webToken) {
        return hasTelegramContact ? 'TELEGRAM' : null;
      }
      if (current === null) {
        return lastIncomingChannel ?? initialChannel;
      }
      return current;
    });
  }, [hasTelegramContact, webToken, lastIncomingChannel, initialChannel]);

  const availableChannels: OutChannel[] = [];
  if (hasTelegramContact) availableChannels.push('TELEGRAM');
  if (webToken) availableChannels.push('WEB');
  const showChannelPicker = availableChannels.length > 1;

  const isPending = send.isPending;

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
      await send.mutateAsync({
        text: trimmed,
        channel: outChannel, 
      });
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
  const noChannelAvailable = availableChannels.length === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">
          Чат {messages.length > 0 && `(${messages.length})`}
        </span>

        {showChannelPicker && (
          <Select
            value={outChannel ?? ''}
            onValueChange={(v) => setOutChannel(v as OutChannel)}
          >
            <SelectTrigger className="h-7 w-auto gap-1 text-[11px] rounded-md px-2">
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
        className="h-[300px] overflow-y-auto rounded-xl border border-muted-foreground/15 bg-muted/10 p-3 space-y-2 scrollbar-thin"
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
          messages.map((m) => <Bubble key={m.id} message={m} />)
        )}
      </div>

      <div className="flex items-end gap-2">
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
          className="min-h-[40px] max-h-[120px] flex-1 resize-none text-xs rounded-xl"
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

function Bubble({ message }: { message: MessageJSON }) {
  const isOut = message.direction === 'OUT';
  const isTemp = message.id.startsWith('temp-');
  const isWeb = message.channel === 'WEB';

  return (
    <div
      className={cn(
        'flex flex-col max-w-[85%] gap-0.5',
        isOut ? 'items-end ml-auto' : 'items-start',
      )}
    >
      <div
        className={cn(
          'px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words',
          isOut
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-background border border-muted-foreground/15 rounded-bl-sm',
          isTemp && 'opacity-60',
        )}
      >
        {message.content}
      </div>
      <span className="text-[10px] text-muted-foreground/60 px-1 tabular-nums flex items-center gap-1">
        {isWeb ? (
          <Globe className="h-2.5 w-2.5 opacity-60" aria-label="Веб-чат" />
        ) : (
          <MessageCircle
            className="h-2.5 w-2.5 opacity-60"
            aria-label={message.channel === 'TELEGRAM' ? 'Telegram' : 'MAX'}
          />
        )}
        {formatTime(message.createdAt)}
      </span>
    </div>
  );
}