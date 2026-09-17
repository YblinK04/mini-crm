'use client';

import { type FormEvent, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  Plus,
  Wallet,
  ShoppingBag,
  MoreVertical,
  Edit2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanStage, KanbanDeal } from '@/store/useDealStore';
import { Button } from '@/components/ui/button';
import { CreateDealDialog } from './create-deal-dialog';
import { useStageMutations } from '@/store/mutations/useStageMutations';
import { TaskCard } from './task-card';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const HEX_COLOR_REGEX = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
const DEFAULT_STAGE_COLOR = '#3b82f6';

interface KanbanColumnProps {
  stage: KanbanStage;
}

export function KanbanColumn({ stage }: KanbanColumnProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditStageOpen, setIsEditStageOpen] = useState(false);
  const [editName, setEditName] = useState(stage.name);
  const [editColor, setEditColor] = useState(stage.color || DEFAULT_STAGE_COLOR);

  const { updateStage, deleteStage } = useStageMutations(stage.pipelineId);

  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { type: 'Column', stageId: stage.id },
  });

  const displayTotalBudget = (stage.totalBudget || 0) / 100;

  const openEditDialog = () => {
    setEditName(stage.name);
    setEditColor(stage.color || DEFAULT_STAGE_COLOR);
    setIsEditStageOpen(true);
  };

  const handleEditStageSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast.error('Название этапа воронки не может быть пустым');
      return;
    }

    let validatedColor = editColor.trim();
    if (!validatedColor.startsWith('#')) {
      validatedColor = `#${validatedColor}`;
    }
    if (!HEX_COLOR_REGEX.test(validatedColor)) {
      toast.error('Некорректный HEX-цвет. Пример: #3B82F6');
      return;
    }

    updateStage.mutate(
      {
        stageId: stage.id,
        name: trimmedName,
        color: validatedColor,
      },
      {
        onSuccess: () => setIsEditStageOpen(false),
      },
    );
  };

  const handleDeleteStage = () => {
    if (stage.deals && stage.deals.length > 0) {
      toast.error(
        'Категорически запрещено удалять колонку, в которой есть активные сделки!',
      );
      return;
    }

    if (
      window.confirm(
        `Вы уверены, что хотите навсегда удалить этап "${stage.name}"?`,
      )
    ) {
      deleteStage.mutate(stage.id);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        className={cn(
          'w-80 max-h-full flex flex-col bg-muted/20 border border-muted-foreground/10 rounded-2xl p-4 transition-all duration-200 shrink-0 select-none',
          isOver && 'bg-muted/40 border-primary/30 ring-1 ring-primary/20 shadow-lg',
        )}
      >
        <div className="flex flex-col gap-1.5 pb-3 mb-2 border-b border-dashed border-muted-foreground/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: stage.color || DEFAULT_STAGE_COLOR }}
              />
              <h3 className="text-sm font-bold text-foreground truncate">
                {stage.name}
              </h3>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] font-bold bg-muted-foreground/10 text-muted-foreground px-2 py-0.5 rounded-full mr-1">
                {stage.deals?.length || 0}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-md"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 border-none shadow-xl"
                >
                  <DropdownMenuItem
                    onClick={openEditDialog}
                    className="text-xs gap-2 cursor-pointer font-medium"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-primary" />
                    <span>Редактировать этап</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDeleteStage}
                    className="text-xs gap-2 cursor-pointer font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить этап</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500/90 dark:text-emerald-400/90">
            <Wallet className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span>{displayTotalBudget.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 min-h-[150px] flex flex-col justify-start relative">
          {stage.deals && stage.deals.length > 0 ? (
            stage.deals.map((deal: KanbanDeal, idx: number) => (
              <TaskCard
                key={deal.id}
                deal={deal}
                index={idx}
                
              />
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/10 rounded-xl p-6 text-center my-auto">
              <ShoppingBag className="w-6 h-6 text-muted-foreground/20 mb-2 shrink-0 animate-pulse" />
              <span className="text-[11px] text-muted-foreground/40 font-medium leading-tight">
                Нет сделок в работе.
                <br />
                Перетащите или добавьте.
              </span>
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setIsCreateOpen(true)}
          className="w-full mt-2 h-9 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl border border-transparent hover:border-primary/10 transition-all duration-200 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Быстрый лид</span>
        </Button>
      </div>

      <CreateDealDialog
        stageId={stage.id}
        pipelineId={stage.pipelineId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      <Dialog open={isEditStageOpen} onOpenChange={setIsEditStageOpen}>
        <DialogContent className="sm:max-w-[400px] border-none shadow-2xl bg-background text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Настройка этапа воронки
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditStageSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest block mb-1">
                Название колонки
              </label>
              <Input
                placeholder="Название этапа"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={updateStage.isPending}
                className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-10 text-sm"
                maxLength={100}
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
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  disabled={updateStage.isPending}
                  className="w-10 h-10 rounded-xl border border-muted-foreground/20 cursor-pointer bg-transparent overflow-hidden shrink-0"
                />
                <Input
                  value={editColor.toUpperCase()}
                  onChange={(e) => setEditColor(e.target.value)}
                  disabled={updateStage.isPending}
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
                onClick={() => setIsEditStageOpen(false)}
                disabled={updateStage.isPending}
                className="rounded-xl text-xs font-semibold"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={updateStage.isPending || !editName.trim()}
                className="min-w-[120px] rounded-xl text-xs font-semibold"
              >
                {updateStage.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}