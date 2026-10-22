'use client';

import { useMemo, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { TaskItem } from './TaskItem';
import { Loader2, CalendarDays, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalendarTasks } from './useTasks';
import type { TaskJSON } from './api';

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );

  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
    toggleComplete,
    remove,
  } = useCalendarTasks();

  const handleToggle = (task: { id: string; completedAt: string | null }) => {
    toggleComplete(task);
  };

  const handleRequestDelete = (task: TaskJSON) => {
    if (!window.confirm(`Удалить задачу «${task.title}»?`)) return;
    remove.mutate(task.id);
  };


  const daysWithTasks = useMemo(
    () => tasks.map((t) => new Date(t.dueAt)),
    [tasks],
  );

  const tasksForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter((t) => isSameDay(new Date(t.dueAt), selectedDate));
  }, [tasks, selectedDate]);


  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label="Загрузка задач"
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertCircle
          className="h-6 w-6 text-destructive"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : 'Не удалось загрузить задачи'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
          Повторить
        </Button>
      </div>
    );
  }


  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="bg-card border rounded-2xl p-4 flex justify-center shrink-0 h-fit">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          locale={ru}
          modifiers={{ hasTasks: daysWithTasks }}
          modifiersStyles={{
            hasTasks: {
              fontWeight: 'bold',
              color: 'hsl(var(--primary))',
            },
          }}
          className="rounded-md border-none"
        />
      </div>

      <div className="flex-1 space-y-4 min-w-0">
        <h3 className="text-sm font-bold border-b pb-2 flex items-center gap-2">
          <CalendarDays
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          {selectedDate
            ? format(selectedDate, 'd MMMM yyyy', { locale: ru })
            : 'Выберите дату'}
        </h3>

        {tasksForSelectedDay.length === 0 ? (
          <div className="text-xs text-muted-foreground italic py-4">
            На этот день задач нет.
          </div>
        ) : (
          <div className="space-y-2">
            {tasksForSelectedDay.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onRequestDelete={handleRequestDelete}
                onCancelDelete={() => {}}
                alwaysShowDelete
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}