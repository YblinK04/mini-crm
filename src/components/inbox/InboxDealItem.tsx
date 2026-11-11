'use client';

import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ArrowRight, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PRIORITY_DOT, PRIORITY_LABEL } from './constants';
import type { InboxDeal, PipelineWithStages } from './types';

interface InboxDealItemProps {
  deal: InboxDeal;
  isLast: boolean;
  targetPipelines: PipelineWithStages[];
  isMoving: boolean;
  disabled: boolean;
  onMove: (pipelineId: string) => void;
}

export function InboxDealItem({
  deal,
  isLast,
  targetPipelines,
  isMoving,
  disabled,
  onMove,
}: InboxDealItemProps) {
  const contact = deal.contacts[0];
  const lastMessage = deal.messages[0];
  const displayName = contact
    ? `${contact.firstName} ${contact.lastName || ''}`.trim()
    : deal.title;
  const initial = displayName.charAt(0).toUpperCase();
  const priorityLabel = PRIORITY_LABEL[deal.priority] ?? PRIORITY_LABEL.MEDIUM;

  return (
    <li
      className={cn(
        'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30',
        !isLast && 'border-b',
      )}
    >
      <div className="relative shrink-0" title={`Приоритет: ${priorityLabel}`}>
        <div
          className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm"
          aria-hidden="true"
        >
          {initial}
        </div>
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
            PRIORITY_DOT[deal.priority] ?? PRIORITY_DOT.MEDIUM,
          )}
          aria-hidden="true"
        />
        <span className="sr-only">Приоритет: {priorityLabel}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">{displayName}</span>
          {deal.bayesLabel === 'LEAD' && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
              Лид
            </span>
          )}
          {deal.bayesLabel === 'COMPLAINT' && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded shrink-0">
              Жалоба
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {lastMessage?.content || 'Нет сообщений'}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {lastMessage && (
          <time
            dateTime={lastMessage.createdAt}
            title={new Date(lastMessage.createdAt).toLocaleString('ru-RU')}
            className="hidden sm:inline text-[11px] text-muted-foreground tabular-nums whitespace-nowrap"
          >
            {formatDistanceToNow(new Date(lastMessage.createdAt), {
              addSuffix: true,
              locale: ru,
            })}
          </time>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              disabled={disabled}
              aria-label={`Переместить сделку «${displayName}» в другую воронку`}
              aria-busy={isMoving}
            >
              {isMoving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Переместить в:
            </div>
            {targetPipelines.length === 0 ? (
              <div className="px-2 py-2 text-xs text-muted-foreground italic">
                Нет воронок для перемещения
              </div>
            ) : (
              targetPipelines.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => onMove(p.id)}
                  className="cursor-pointer text-xs"
                >
                  <span className="flex items-center justify-between w-full gap-2">
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {p.stages[0]?.name}
                    </span>
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}