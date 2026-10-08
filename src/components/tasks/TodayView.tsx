'use client';

import { useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTodayTasks, type ToggleTarget } from './useTasks';
import { TaskGroup } from './TaskGroup';
import { TaskQuickForm } from './TaskQuikForm';
import { TaskDeleteConfirmDialog } from './TaskDeleteConfiirmDialog';
import { useDeferredDelete } from './useDefferedDelete';
import type { TaskJSON } from './api';
import { useState } from 'react';

export function TodayView() {
  const {
    data,
    isLoading,
    isError,
    isFetching,
    error,
    refetch,
    create,
    toggleComplete,
    remove,
  } = useTodayTasks();

  const [confirmTask, setConfirmTask] = useState<TaskJSON | null>(null);

  const { pendingIds, schedule, cancel } = useDeferredDelete((id) =>
    remove.mutate(id),
  );


  const handleToggle = useCallback(
    (task: ToggleTarget) => toggleComplete(task),
    [toggleComplete],
  );

  const handleRequestDelete = useCallback((task: TaskJSON) => {
    setConfirmTask(task);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!confirmTask) return;
    schedule(confirmTask.id);
    setConfirmTask(null);
  }, [confirmTask, schedule]);

  const handleCreate = useCallback(
    async (title: string, dueAt: Date) => {
      await create.mutateAsync({ title, dueAt: dueAt.toISOString() });
    },
    [create],
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Загрузка...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error instanceof Error
            ? error.message
            : 'Не удалось загрузить задачи'}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Повторить
        </Button>
      </div>
    );
  }

  const isEmpty =
    data.overdue.length === 0 &&
    data.today.length === 0 &&
    data.later.length === 0;

  return (
    <div className="space-y-6">
      <TaskQuickForm isPending={create.isPending} onSubmit={handleCreate} />

      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-muted-foreground/20 py-12 text-center text-sm text-muted-foreground">
          На сегодня задач нет. Добавьте первую выше.
        </div>
      ) : (
        <>
          <TaskGroup
            title="Просрочено"
            tasks={data.overdue}
            variant="overdue"
            onToggle={handleToggle}
            onRequestDelete={handleRequestDelete}
            onCancelDelete={cancel}
            pendingIds={pendingIds}
          />
          <TaskGroup
            title="Сегодня"
            tasks={data.today}
            onToggle={handleToggle}
            onRequestDelete={handleRequestDelete}
            onCancelDelete={cancel}
            pendingIds={pendingIds}
          />
          <TaskGroup
            title="Позже"
            tasks={data.later}
            onToggle={handleToggle}
            onRequestDelete={handleRequestDelete}
            onCancelDelete={cancel}
            pendingIds={pendingIds}
          />
        </>
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