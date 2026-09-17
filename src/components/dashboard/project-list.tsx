'use client';

import React from 'react';
import { ProjectCard, type DashboardPipeline } from './project-card';
import { Loader2, LayoutGrid } from 'lucide-react';

interface PipelineListProps {
  initialPipelines: DashboardPipeline[];
  isLoading?: boolean;
}

export function ProjectList({ initialPipelines, isLoading = false }: PipelineListProps) {
  const pipelines = initialPipelines || [];

  if (isLoading && pipelines.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pipelines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed rounded-3xl border-border/50 bg-muted/5 mx-4 select-none">
        <LayoutGrid className="h-10 w-10 mb-4 text-muted-foreground/20 animate-pulse" />
        <p className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground/50">
          Воронки продаж ещё не созданы
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0">
      {pipelines.map((pipeline) => (
        <ProjectCard key={pipeline.id} pipeline={pipeline} />
      ))}
    </div>
  );
}
