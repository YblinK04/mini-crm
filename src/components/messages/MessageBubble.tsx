'use client';

import { Brain, Globe, MessageCircle } from 'lucide-react';
import { TrainingLabel } from '@prisma/client';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MessageJSON } from './api';

const LOCALE = 'ru-RU';

const LABEL_OPTIONS: { value: TrainingLabel; label: string; emoji: string }[] = [
  { value: TrainingLabel.LEAD, label: 'Лид / заявка', emoji: '🎯' },
  { value: TrainingLabel.SPAM, label: 'Спам', emoji: '🚫' },
  { value: TrainingLabel.COMPLAINT, label: 'Жалоба', emoji: '😠' },
  { value: TrainingLabel.OTHER, label: 'Другое', emoji: '💬' },
];

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

interface MessageBubbleProps {
  message: MessageJSON;
  onLabel?: (messageId: string, label: TrainingLabel) => void;
}

export function MessageBubble({ message, onLabel }: MessageBubbleProps) {
  const isOut = message.direction === 'OUT';
  const isTemp = message.id.startsWith('temp-');
  const isWeb = message.channel === 'WEB';

  const canLabel = Boolean(onLabel) && !isOut && !isTemp;

  return (
    <div
      className={cn(
        'group flex flex-col max-w-[85%] gap-0.5 relative',
        isOut ? 'items-end ml-auto' : 'items-start',
      )}
    >
      <div className="flex items-center gap-1">
        {!isOut && canLabel && (
          <LabelDropdown
            messageId={message.id}
            onLabel={onLabel!}
          />
        )}

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

function LabelDropdown({
  messageId,
  onLabel,
}: {
  messageId: string;
  onLabel: (messageId: string, label: TrainingLabel) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'shrink-0 h-6 w-6 flex items-center justify-center rounded-full',
            'border border-border/60 bg-background text-muted-foreground',
            'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
            'transition-opacity duration-150 hover:text-primary hover:border-primary/40',
          )}
          aria-label="Разметить сообщение для классификатора"
          title="Разметить для обучения"
        >
          <Brain className="h-3 w-3" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Разметить как
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LABEL_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            className="text-xs cursor-pointer gap-2"
            onClick={() => onLabel(messageId, opt.value)}
          >
            <span aria-hidden="true">{opt.emoji}</span>
            <span>{opt.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}