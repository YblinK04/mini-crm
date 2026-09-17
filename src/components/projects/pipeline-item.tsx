'use client';

import Link from 'next/link';
import { Kanban } from 'lucide-react'; 
import { cn } from '@/lib/utils';

interface PipelineItemProps {
  pipeline: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  collapsed: boolean;
  isActive: boolean;  
}


export function PipelineItem({ pipeline, collapsed, isActive }: PipelineItemProps) {
  return (
    <Link
      href={`/pipelines/${pipeline.id}`} 
      title={collapsed ? pipeline.name : undefined} 
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group w-full",
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Kanban 
        className={cn(
          "w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
          isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"
        )} 
      />
      
      {!collapsed && (
        <span className="truncate animate-in fade-in duration-200">
          {pipeline.name}
        </span>
      )}
    </Link>
  );
}
