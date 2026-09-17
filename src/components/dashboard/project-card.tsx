'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Layers, TrendingUp, Wallet } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export interface DashboardPipeline {
  id: string;
  name: string;
  description?: string | null;
  updatedAt: Date | string;
  stages: {
    id: string;
    name: string;
    color: string;
    deals: {
      id: string;
      budget: number;
    }[];
  }[];
}

interface PipelineCardProps {
  pipeline: DashboardPipeline;
}

export function ProjectCard({ pipeline }: PipelineCardProps) {
  const stages = pipeline.stages || [];
  
  const metrics = stages.reduce(
    (acc, stage) => {
      const dealsInStage = stage.deals || [];
      acc.totalDealsCount += dealsInStage.length;
      
      dealsInStage.forEach((deal) => {
        acc.totalPipelineBudget += deal.budget;
      });
      
      return acc;
    },
    { totalDealsCount: 0, totalPipelineBudget: 0 }
  );

  const budgetInRubles = metrics.totalPipelineBudget / 100;

  return (
    <Link href={`/pipelines/${pipeline.id}`}>
      <Card className="group relative h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 border-none bg-card/60 backdrop-blur-md ring-1 ring-border/50 overflow-hidden select-none">
        
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary/40 transition-all group-hover:h-2.5" />

        <CardHeader className="pt-8 pb-4">
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="text-xl font-black tracking-tight truncate text-foreground group-hover:text-primary transition-colors">
              {pipeline.name}
            </CardTitle>
            <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-wider bg-primary/10 text-primary border-none rounded-md shrink-0">
              Воронка продаж
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium italic">
            {pipeline.description || "Описание этой воронки продаж отсутствует..."}
          </p>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 ring-1 ring-emerald-500/5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/60 leading-none mb-1">
                Общая сумма сделок
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none truncate">
                {budgetInRubles.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/40">
              <Layers className="h-4 w-4 text-primary/70 shrink-0" />
              <div className="flex flex-col leading-none">
                <span className="text-[8px] font-bold uppercase text-muted-foreground mb-0.5">Этапов</span>
                <span className="text-xs font-black text-foreground">{stages.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/40">
              <TrendingUp className="h-4 w-4 text-amber-500/70 shrink-0" />
              <div className="flex flex-col leading-none">
                <span className="text-[8px] font-bold uppercase text-muted-foreground mb-0.5">Активных сделок</span>
                <span className="text-xs font-black text-foreground">{metrics.totalDealsCount}</span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-4 pb-4 border-t border-border/10 flex justify-between items-center text-[10px] font-bold uppercase tracking-tight text-muted-foreground/70">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 opacity-60" />
            <span>CRM Модуль</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 opacity-60" />
            <span>Обновлено: {formatDate(pipeline.updatedAt)}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
