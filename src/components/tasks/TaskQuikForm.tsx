'use client';

import { useState, type FormEvent } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const DEFAULT_HOUR = 18;

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateFromInput(value: string, hours: number): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, hours, 0, 0, 0);
}

function defaultDueDate(): Date {
  const now = new Date();
  const d = new Date(now);
  d.setHours(DEFAULT_HOUR, 0, 0, 0);
  if (d <= now) d.setDate(d.getDate() + 1);
  return d;
}

interface TaskQuickFormProps {
 
  onSubmit: (title: string, dueAt: Date) => Promise<unknown>;
  isPending: boolean;
  placeholder?: string;
  initialDueDate?: Date;
}

export function TaskQuickForm({
  onSubmit,
  isPending,
  placeholder = 'Что нужно сделать?',
  initialDueDate,
}: TaskQuickFormProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(() =>
    toDateInputValue(initialDueDate ?? defaultDueDate()),
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const due = dateFromInput(dueDate, DEFAULT_HOUR);
    try {
      await onSubmit(trimmed, due);
      setTitle('');
    } catch {
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={isPending}
      className="flex items-center gap-2 rounded-xl border border-muted-foreground/15 bg-muted/20 p-1.5"
    >
      <Input
        placeholder={placeholder}
        aria-label={placeholder}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isPending}
        className="h-9 flex-1 border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
      />

      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        disabled={isPending}
        aria-label="Дата"
        min={toDateInputValue(new Date())}
        className="h-9 rounded-md border border-muted-foreground/15 bg-background px-2 text-xs"
      />

      <Button
        type="submit"
        size="icon"
        disabled={isPending || !title.trim()}
        className="h-9 w-9 shrink-0 rounded-lg"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}