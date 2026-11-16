
'use client';

import { TaskItem } from './TaskItem';
import type { TaskJSON } from './api';
import type { ToggleTarget } from './useTasks';

interface TaskGroupProps {
  title: string;
  tasks: TaskJSON[];
  variant?: 'default' | 'overdue';
  onToggle: (task: ToggleTarget) => void;
  onRequestDelete: (task: TaskJSON) => void;
  onCancelDelete: (id: string) => void;
  pendingIds: Set<string>;
  
  alwaysShowDelete?: boolean;
}

export function TaskGroup({
  title,
  tasks,
  variant = 'default',
  onToggle,
  onRequestDelete,
  onCancelDelete,
  pendingIds,
  alwaysShowDelete = false,
}: TaskGroupProps) {
  if (tasks.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
        {title}
        <span className="ml-2 font-bold tabular-nums text-muted-foreground/40">
          {tasks.length}
        </span>
      </h2>
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            variant={variant}
            isPendingDelete={pendingIds.has(task.id)}
            onToggle={onToggle}
            onRequestDelete={onRequestDelete}
            onCancelDelete={onCancelDelete}
            alwaysShowDelete={alwaysShowDelete}
          />
        ))}
      </div>
    </section>
  );
}