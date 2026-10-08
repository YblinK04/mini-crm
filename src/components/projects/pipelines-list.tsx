'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Kanban, Layers, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreatePipelineDialog } from './create-pipeline-dialog';

interface PipelineItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  stagesCount: number;
  dealsCount: number;
  color: string;
}

interface PipelinesListProps {
  pipelines: PipelineItem[];
}

export function PipelinesList({ pipelines }: PipelinesListProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
          Всего воронок: {pipelines.length}
        </span>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="h-8 gap-1.5 rounded-lg text-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Создать воронку</span>
        </Button>
      </div>

      {pipelines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-muted-foreground/20 py-16 text-center space-y-3">
          <Kanban className="h-8 w-8 mx-auto text-muted-foreground/30" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Пока нет воронок
            </p>
            <p className="text-xs text-muted-foreground">
              Создайте первую — она появится в сайдбаре.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="mt-2 h-8 gap-1.5 rounded-lg text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Создать воронку</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pipelines.map((pipeline) => (
            <Link
              key={pipeline.id}
              href={`/pipelines/${pipeline.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-muted-foreground/10 bg-card p-4 transition-all hover:border-primary/30 hover:bg-muted/20 hover:shadow-sm"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span
                  className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: pipeline.color }}
                />
                <h3 className="text-sm font-bold tracking-tight truncate group-hover:text-primary transition-colors">
                  {pipeline.name}
                </h3>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3 opacity-60" />
                  {pipeline.stagesCount}{' '}
                  {pluralize(pipeline.stagesCount, 'этап', 'этапа', 'этапов')}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3 opacity-60" />
                  {pipeline.dealsCount}{' '}
                  {pluralize(pipeline.dealsCount, 'сделка', 'сделки', 'сделок')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreatePipelineDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}