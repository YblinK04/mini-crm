import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CalendarCheck, ArrowRight, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashboardTask {
  id: string;
  title: string;
  dueAt: string;
  deal: {
    id: string;
    title: string;
    
    pipelineId?: string;
  } | null;
  isOverdue: boolean;
}

interface TodayTasksWidgetProps {
  tasks: DashboardTask[];
}

const MAX_VISIBLE = 5;

export function TodayTasksWidget({ tasks }: TodayTasksWidgetProps) {
  const visible = tasks.slice(0, MAX_VISIBLE);
  const rest = tasks.length - visible.length;

  return (
    <Card className="border-none shadow-md bg-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck
              className="h-4 w-4 text-primary"
              aria-hidden="true"
            />
            <CardTitle className="text-base font-bold text-foreground">
              Актуальные задачи
            </CardTitle>
          </div>
          <Link
            href="/today"
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <span>Все задачи</span>
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        {tasks.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground italic">
            На сегодня задач нет. Отличный день, чтобы поработать со сделками.
          </div>
        ) : (
          <div className="space-y-1.5">
            {visible.map((task) => {
              const href = task.deal?.pipelineId
                ? `/pipelines/${task.deal.pipelineId}?openDeal=${task.deal.id}`
                : '/today';

              return (
                <Link
                  key={task.id}
                  href={href}
                  className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 transition-colors hover:border-muted-foreground/10 hover:bg-muted/20"
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 shrink-0 rounded-full',
                      task.isOverdue ? 'bg-destructive' : 'bg-primary/60',
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium leading-snug truncate">
                      {task.title}
                    </div>
                    {task.deal?.title && (
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground/70">
                        <Briefcase
                          className="h-3 w-3 shrink-0 opacity-60"
                          aria-hidden="true"
                        />
                        <span className="truncate">{task.deal.title}</span>
                      </div>
                    )}
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-[11px] font-medium tabular-nums',
                      task.isOverdue
                        ? 'text-destructive'
                        : 'text-muted-foreground',
                    )}
                  >
                    {formatTime(task.dueAt)}
                  </span>
                </Link>
              );
            })}

            {rest > 0 && (
              <Link
                href="/today"
                className="flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-muted-foreground/70 transition-colors hover:bg-muted/20 hover:text-primary"
              >
                <span>
                  Ещё {rest}{' '}
                  {pluralize(rest, 'задача', 'задачи', 'задач')}
                </span>
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function pluralize(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function formatTime(dueAt: string): string {
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return '—';

  const now = new Date();

  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isToday) {
    return d.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}