// src/components/kanban/kanban-board.tsx

'use client';

import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCorners,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDealStore, KanbanStage } from '@/store/useDealStore';
import { useKanbanDnd } from '@/store/useKanbanDnd';
import { KanbanColumn } from './kanban-column';
import { PipelineDataDTO } from '@/services/pipeline.service';
import { Button } from '@/components/ui/button';
import { Plus, Layers } from 'lucide-react';
import { useStageMutations } from '@/store/mutations/useStageMutations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#3b82f6');
  const [isInitialized, setIsInitialized] = useState(false);

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

  const { createStage } = useStageMutations(initialData.id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const handleCreateStageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newStageName.trim();
    if (!trimmedName) return;

    let validatedColor = newStageColor.trim();
    if (!validatedColor.startsWith('#')) {
      validatedColor = `#${validatedColor}`;
    }

    createStage.mutate(
      {
        name: trimmedName,
        color: validatedColor,
      },
      {
        onSuccess: () => {
          setNewStageName('');
          setNewStageColor('#3b82f6');
          setIsStageDialogOpen(false);
        },
      },
    );
  };

  if (!isInitialized || stages.length === 0) {
    return (
      <div className="absolute inset-0 flex items-start gap-4 overflow-x-auto pb-4 p-4 pr-8">
        {initialData.stages.map((stage) => (
          <KanbanColumn key={stage.id} stage={stage as KanbanStage} />
        ))}
        <div className="w-80 h-[140px] flex flex-col bg-muted/5 border border-dashed border-muted-foreground/20 rounded-2xl p-4 shrink-0 justify-center items-center text-center">
          <Layers className="w-5 h-5 text-muted-foreground/30 mb-2" />
          <Button
            variant="outline"
            disabled
            className="text-xs font-semibold gap-1.5 h-9 rounded-xl px-4 text-muted-foreground"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить этап</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <DndContext
        id="crm-kanban-dnd-root"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="absolute inset-0 flex items-start gap-4 overflow-x-auto pb-4 select-none scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent p-4 pr-8">
          {stages.map((stage) => (
            <KanbanColumn key={stage.id} stage={stage} />
          ))}

          <div className="w-80 h-[140px] flex flex-col bg-muted/5 border border-dashed border-muted-foreground/20 rounded-2xl p-4 shrink-0 justify-center items-center text-center">
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

      <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
        <DialogContent className="sm:max-w-[400px] border-none shadow-2xl bg-background text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Новый этап воронки
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateStageSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest block mb-1">
                Название колонки
              </label>
              <Input
                placeholder="Напр. Замер назначен, Думает"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                disabled={createStage.isPending}
                className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-10 text-sm"
                maxLength={50}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest block mb-1">
                Цвет маркера этапа
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={newStageColor}
                  onChange={(e) => setNewStageColor(e.target.value)}
                  disabled={createStage.isPending}
                  className="w-10 h-10 rounded-xl border border-muted-foreground/20 cursor-pointer bg-transparent overflow-hidden shrink-0"
                />
                <Input
                  value={newStageColor.toUpperCase()}
                  onChange={(e) => setNewStageColor(e.target.value)}
                  disabled={createStage.isPending}
                  placeholder="#3B82F6"
                  className="bg-muted/30 border-none uppercase font-mono max-w-[120px] rounded-xl h-10 text-sm tracking-wider"
                  maxLength={7}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2 sm:gap-0 border-t border-muted/20">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsStageDialogOpen(false)}
                disabled={createStage.isPending}
                className="rounded-xl text-xs font-semibold"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={createStage.isPending || !newStageName.trim()}
                className="min-w-[120px] rounded-xl text-xs font-semibold"
              >
                {createStage.isPending ? 'Создание...' : 'Добавить этап'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}