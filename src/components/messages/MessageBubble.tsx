import { Globe, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageJSON } from './api';

const LOCALE = 'ru-RU';

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

export function MessageBubble({ message }: { message: MessageJSON }) {
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