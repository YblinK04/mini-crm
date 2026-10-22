'use client';

import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime, TEMP_ID_PREFIX } from './utils';
import type { ChatMessage } from './types';

export function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex justify-center sticky top-0 z-[1] pointer-events-none">
      <span className="rounded-full bg-zinc-200/90 dark:bg-zinc-800/90 backdrop-blur-sm px-3 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 shadow-sm">
        {label}
      </span>
    </div>
  );
}

export function MessageBubble({
  msg,
  showTail,
}: {
  msg: ChatMessage;
  showTail: boolean;
}) {
  const isIncoming = msg.direction === 'IN';
  const isTemp =
    typeof msg.id === 'string' && msg.id.startsWith(TEMP_ID_PREFIX);
  const time = formatTime(msg.createdAt);

  return (
    <div
      className={cn(
        'flex w-full animate-in fade-in slide-in-from-bottom-1 duration-200',
        isIncoming ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'relative px-4 py-2.5 text-[15px] leading-relaxed break-words shadow-sm max-w-[85%]',
          isIncoming
            ? 'bg-blue-600 text-white'
            : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/50',
          showTail && isIncoming && 'rounded-2xl rounded-tr-sm',
          showTail && !isIncoming && 'rounded-2xl rounded-tl-sm',
          !showTail && 'rounded-2xl',
          isTemp && 'opacity-70',
        )}
      >
        <div className="whitespace-pre-wrap pb-1">{msg.content}</div>

        <div
          className={cn(
            'flex items-center justify-end gap-1 -mb-1 mt-0.5 text-[10px] tabular-nums select-none',
            isIncoming
              ? 'text-blue-200' 
              : 'text-zinc-400 dark:text-zinc-400',
          )}
        >
          {time}
          {isIncoming && !isTemp && (
            <CheckCheck className="h-3.5 w-3.5" aria-label="Отправлено" />
          )}
          {isIncoming && isTemp && (
            <Check className="h-3.5 w-3.5 opacity-60" aria-label="Отправляется" />
          )}
        </div>
      </div>
    </div>
  );
}