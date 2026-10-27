'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  DndContext,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import { useDealStore, KanbanStage } from '@/store/useDealStore';
import { useKanbanDnd } from '@/store/useKanbanDnd';
import { KanbanColumn } from './kanban-column';
import { PipelineDataDTO } from '@/services/pipeline.service';
import { Button } from '@/components/ui/button';
import { Plus, Layers } from 'lucide-react';

import { CreateStageDialog } from './CreateStageDialog';
import { useKanbanSensors } from './hooks/useKanbanSensors';

interface KanbanBoardProps {
  initialData: PipelineDataDTO;
  initialOpenDealId?: string;
}

export default function KanbanBoard({
  initialData,
  initialOpenDealId,
}: KanbanBoardProps) {
  const setPipelineData = useDealStore((state) => state.setPipelineData);
  const stages = useDealStore((state) => state.stages);
  const openDealForEdit = useDealStore((state) => state.openDealForEdit);

  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      setPipelineData(initialData);
      setIsInitialized(true);
    }
  }, [initialData, setPipelineData]);

  useEffect(() => {
    if (!isInitialized || !initialOpenDealId || !openDealForEdit) return;

    const deal = initialData.stages
      .flatMap((s) => s.deals)
      .find((d) => d.id === initialOpenDealId);

    if (deal) {
      openDealForEdit(deal);
    }
  }, [isInitialized, initialOpenDealId, initialData, openDealForEdit]);

  const { handleDragOver, handleDragEnd } = useKanbanDnd(initialData.id);
  const sensors = useKanbanSensors();

  const scrollToStage = (stageId: string) => {
    const el = document.getElementById(`stage-${stageId}`);
    const container = boardRef.current;
    if (el && container) {
      container.scrollTo({
        left: el.offsetLeft - container.offsetLeft,
        behavior: 'smooth',
      });
    }
  };

  if (!isInitialized || stages.length === 0) {
    return (
      <div className="absolute inset-0 flex items-start gap-3 md:gap-4 overflow-x-auto pb-4 p-3 md:p-4 pr-8">
        {initialData.stages.map((stage) => (
          <KanbanColumn key={stage.id} stage={stage as KanbanStage} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      
      <div className="md:hidden flex overflow-x-auto gap-2 p-3 pb-2 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {stages.map((stage) => (
          <Button
            key={stage.id}
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full text-xs bg-muted/50 border-none"
            onClick={() => scrollToStage(stage.id)}
          >
            <span 
              className="w-2 h-2 rounded-full mr-1.5" 
              style={{ backgroundColor: stage.color }}
            />
            {stage.name}
          </Button>
        ))}
      </div>

      <DndContext
        id="crm-kanban-dnd-root"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div 
          ref={boardRef}
          className="flex-1 min-h-0 flex items-start gap-3 md:gap-4 overflow-x-auto pb-4 select-none scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent p-3 md:p-4 pr-8 snap-x snap-mandatory"
        >
          {stages.map((stage) => (
            <div key={stage.id} id={`stage-${stage.id}`} className="snap-start shrink-0">
              <KanbanColumn stage={stage} />
            </div>
          ))}

          <div className="snap-start shrink-0 w-[85vw] sm:w-80 h-[140px] flex flex-col bg-muted/5 border border-dashed border-muted-foreground/20 rounded-2xl p-4 justify-center items-center text-center">
            <Layers className="w-5 h-5 text-muted-foreground/30 mb-2 animate-pulse" />
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStageDialogOpen(true)}
              className="text-xs font-semibold gap-1.5 h-9 bg-background border-muted-foreground/15 text-muted-foreground hover:text-primary hover:border-primary/30 rounded-xl px-4 transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить этап</span>
            </Button>
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }} />
      </DndContext>

      <CreateStageDialog
        pipelineId={initialData.id}
        open={isStageDialogOpen}
        onOpenChange={setIsStageDialogOpen}
      />
    </div>
  );
}