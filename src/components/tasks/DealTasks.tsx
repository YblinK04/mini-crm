
'use client';

import {
  useCallback,
  useMemo,
  useState,
  type KeyboardEvent,
} from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDealTasks, type ToggleTarget } from './useTasks';
import { TaskItem } from './TaskItem';
import { TaskDeleteConfirmDialog } from './TaskDeleteConfiirmDialog';
import { useDeferredDelete } from './useDefferedDelete';
import {
  DEFAULT_HOUR,
  dateFromInput,
  defaultDueDate,
  toDateInputValue,
} from './date';
import type { TaskJSON } from './api';

interface DealTasksProps {
  dealId: string;
}

export function DealTasks({ dealId }: DealTasksProps) {
  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    create,
    toggleComplete,
    remove,
  } = useDealTasks(dealId);

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(() =>
    toDateInputValue(defaultDueDate()),
  );
  const [confirmTask, setConfirmTask] = useState<TaskJSON | null>(null);

  const { pendingIds, schedule, cancel } = useDeferredDelete((id) =>
    remove.mutate(id),
  );

  const handleAdd = useCallback(async () => {
    if (create.isPending) return; 
    const trimmed = title.trim();
    if (!trimmed) return;

    const due = dateFromInput(dueDate, DEFAULT_HOUR);
    try {
      await create.mutateAsync({
        title: trimmed,
        dueAt: due.toISOString(),
        dealId,
      });
      setTitle('');
      setAdding(false);
    } catch {
    }
  }, [create, title, dueDate, dealId]);

  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void handleAdd();
      }
      if (e.key === 'Escape') {
        setAdding(false);
        setTitle('');
      }
    },
    [handleAdd],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!confirmTask) return;
    schedule(confirmTask.id);
    setConfirmTask(null);
  }, [confirmTask, schedule]);

  const handleToggle = useCallback(
    (task: ToggleTarget) => toggleComplete(task),
    [toggleComplete],
  );

  const handleRequestDelete = useCallback((task: TaskJSON) => {
    setConfirmTask(task);
  }, []);

  // Сортировка и признак просрочки зависят от «сейчас».
  // Пересчитываем только при изменении списка задач — не при каждом рендере.
  const sorted = useMemo(() => {
    const now = Date.now();
    return [...tasks].sort((a, b) => {
      const aOver = !a.completedAt && new Date(a.dueAt).getTime() < now;
      const bOver = !b.completedAt && new Date(b.dueAt).getTime() < now;
      if (aOver !== bOver) return aOver ? -1 : 1;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });
  }, [tasks]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">
          Задачи {tasks.length > 0 && `(${tasks.length})`}
        </span>
        {!adding && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAdding(true)}
            className="h-7 text-[10px] font-bold gap-1 rounded-lg px-2.5"
            aria-label="Добавить задачу"
          >
            <Plus className="w-3 h-3" />
            <span>Добавить</span>
          </Button>
        )}
      </div>

      {adding && (
        <div
          onKeyDown={handleKey}
          className="flex items-center gap-2 rounded-xl border border-muted-foreground/15 bg-muted/20 p-1.5"
        >
          <Input
            autoFocus
            placeholder="Что нужно сделать?"
            aria-label="Что нужно сделать"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={create.isPending}
            className="h-9 flex-1 border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={create.isPending}
            aria-label="Дата"
            min={toDateInputValue(new Date())}
            className="h-9 rounded-md border border-muted-foreground/15 bg-background px-2 text-xs"
          />
          <Button
            type="button"
            size="icon"
            onClick={() => void handleAdd()}
            disabled={create.isPending || !title.trim()}
            className="h-9 w-9 shrink-0 rounded-lg"
            aria-label="Создать задачу"
          >
            {create.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-xs text-muted-foreground py-2">Загрузка...</div>
      ) : isError ? (
        <div className="flex items-center gap-2 text-xs text-destructive py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          {error instanceof Error ? error.message : 'Не удалось загрузить задачи'}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-xs text-muted-foreground/50 italic text-center py-2">
          Задач пока нет
        </div>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((task) => {
            const isOverdue =
              !task.completedAt && new Date(task.dueAt).getTime() < Date.now();
            return (
              <TaskItem
                key={task.id}
                task={task}
                variant={isOverdue ? 'overdue' : 'default'}
                isPendingDelete={pendingIds.has(task.id)}
                onToggle={handleToggle}
                onRequestDelete={handleRequestDelete}
                onCancelDelete={cancel}
              />
            );
          })}
        </div>
      )}

      <TaskDeleteConfirmDialog
        open={Boolean(confirmTask)}
        onOpenChange={(open) => !open && setConfirmTask(null)}
        taskTitle={confirmTask?.title ?? ''}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}