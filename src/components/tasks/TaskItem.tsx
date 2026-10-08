'use client';

import { memo, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Trash2,
  Calendar,
  Briefcase,
  ArrowUpRight,
  Undo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { TaskJSON } from './api';
import type { ToggleTarget } from './useTasks';

const LOCALE = 'ru-RU';
const UNDO_WINDOW_MS = 3000;

interface TaskItemProps {
  task: TaskJSON;
  onToggle: (task: ToggleTarget) => void;
  onRequestDelete: (task: TaskJSON) => void;
  onCancelDelete: (id: string) => void;
  isPendingDelete?: boolean;
  variant?: 'default' | 'overdue';
 
  alwaysShowDelete?: boolean;
}

function formatDue(dueAt: string): string {
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return '—';

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const startOfDayAfter = new Date(startOfTomorrow);
  startOfDayAfter.setDate(startOfDayAfter.getDate() + 1);

  const time = d.toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (d >= startOfToday && d < startOfTomorrow) return time;
  if (d >= startOfTomorrow && d < startOfDayAfter) return `Завтра, ${time}`;

  if (d < startOfToday) {
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    if (d >= startOfYesterday) return `Вчера, ${time}`;
  }

  return (
    d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' }) +
    ', ' +
    time
  );
}

function TaskItemInner({
  task,
  onToggle,
  onRequestDelete,
  onCancelDelete,
  isPendingDelete = false,
  variant = 'default',
  alwaysShowDelete = false,
}: TaskItemProps) {
  const router = useRouter();

  const isCompleted = Boolean(task.completedAt);
  const isOverdue = variant === 'overdue';

  const canNavigate = Boolean(task.deal?.pipelineId);
  const clickable = canNavigate && !isPendingDelete;

  const handleOpenDeal = () => {
    if (!task.deal?.pipelineId) return;
    router.push(
      `/pipelines/${task.deal.pipelineId}?openDeal=${task.deal.id}`,
    );
  };
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 overflow-hidden rounded-xl border bg-background px-3 py-2.5 transition-[colors,opacity,border-color]',
        isOverdue
          ? 'border-destructive/20 bg-destructive/5'
          : 'border-muted-foreground/10',
        isCompleted && 'opacity-50',
        isPendingDelete && 'opacity-70',
        clickable && 'cursor-pointer hover:border-muted-foreground/25',
      )}
      onClick={clickable ? handleOpenDeal : undefined}
      role={clickable ? 'link' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpenDeal();
              }
            }
          : undefined
      }
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={isCompleted}
        aria-label={isCompleted ? 'Снять отметку' : 'Отметить выполненной'}
        onClick={(e) => {
          stop(e);
          if (!isPendingDelete) {
            onToggle({ id: task.id, completedAt: task.completedAt });
          }
        }}
        disabled={isPendingDelete}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
          isCompleted
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/30 hover:border-primary',
          isOverdue && !isCompleted && 'border-destructive/40',
          isPendingDelete && 'cursor-not-allowed opacity-50',
        )}
      >
        {isCompleted && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'text-sm font-medium leading-snug break-words',
            isCompleted && 'line-through text-muted-foreground',
          )}
        >
          {task.title}
        </div>

        {task.deal?.title && (
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground/80">
            <Briefcase className="h-3 w-3 shrink-0 opacity-60" />
            <span className="truncate">{task.deal.title}</span>
          </div>
        )}

        {task.description && (
          <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!isPendingDelete && (
          <>
            <span
              className={cn(
                'flex items-center gap-1 text-[11px] font-medium tabular-nums',
                isOverdue && !isCompleted
                  ? 'text-destructive'
                  : 'text-muted-foreground',
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDue(task.dueAt)}
            </span>

            {canNavigate && (
              <ArrowUpRight
                className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                stop(e);
                onRequestDelete(task);
              }}
              aria-label="Удалить"
              className={cn(
                'h-7 w-7 text-muted-foreground transition-opacity hover:text-destructive',
                alwaysShowDelete
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100',
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}

        {isPendingDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              stop(e);
              onCancelDelete(task.id);
            }}
            aria-label="Отменить удаление"
            className="h-7 gap-1 rounded-lg px-2.5 text-[10px] font-bold text-destructive hover:bg-destructive/10"
          >
            <Undo2 className="h-3 w-3" />
            <span>Отменить</span>
          </Button>
        )}
      </div>

      {isPendingDelete && (
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-0.5 origin-left bg-destructive/60"
          style={{
            animation: `shrinkProgress ${UNDO_WINDOW_MS}ms linear forwards`,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export const TaskItem = memo(TaskItemInner);