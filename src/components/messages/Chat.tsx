'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDealMessages } from './useMessage';
import type { MessageJSON } from './api';

interface ChatProps {
  dealId: string;
}

const LOCALE = 'ru-RU';
const SCROLL_BOTTOM_THRESHOLD = 40;

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

export function Chat({ dealId }: ChatProps) {
  const { data: messages = [], isLoading, send } = useDealMessages(dealId);
  const [text, setText] = useState('');

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

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">
          Чат {messages.length > 0 && `(${messages.length})`}
        </span>
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
            <MessageSquare className="w-6 h-6 opacity-40" />
            <span>
              Сообщений пока нет.
              <br />
              Когда клиент напишет боту — они появятся здесь.
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
          placeholder="Написать сообщение... (Enter — отправить)"
          rows={1}
          className="min-h-[40px] max-h-[120px] flex-1 resize-none text-xs rounded-xl"
        />
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={!text.trim()}
          className="h-10 w-10 shrink-0 rounded-xl"
          aria-label="Отправить"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Bubble({ message }: { message: MessageJSON }) {
  const isOut = message.direction === 'OUT';
  const isTemp = message.id.startsWith('temp-');

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
      <span className="text-[10px] text-muted-foreground/60 px-1 tabular-nums">
        {formatTime(message.createdAt)}
      </span>
    </div>
  );
}