'use client';

import { PipelineItem } from "@/components/projects/pipeline-item";
import { Trash2 } from 'lucide-react';
import { Pipeline } from "@prisma/client"; 

interface SidebarSectionProps {
  title: string;
  pipelines: (Omit<Pipeline, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
  })[];
  collapsed: boolean;
  isActive: (id: string) => boolean;
  onDelete: (id: string, name: string) => void;
}

export function SidebarSection({ 
  title, 
  pipelines, 
  collapsed, 
  isActive, 
  onDelete 
}: SidebarSectionProps) {
  if (pipelines.length === 0) return null;

  return (
    <div className="space-y-1 mb-6">
      {!collapsed && (
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-2 mb-2">
          {title} ({pipelines.length})
        </h3>
      )}
      <div className={collapsed ? 'flex flex-col items-center gap-2' : 'space-y-1'}>
        {pipelines.map((pipeline) => (
          <div key={pipeline.id} className="group relative w-full">
            <PipelineItem
              pipeline={pipeline}
              collapsed={collapsed}
              isActive={isActive(pipeline.id)}
            />
            {!collapsed && (
              <button
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(pipeline.id, pipeline.name);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                aria-label={`Удалить воронку ${pipeline.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
