'use client';

import { useCallback, useState } from 'react';
import { useStageMutations } from '@/store/mutations/useStageMutations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateStageDialogProps {
  pipelineId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStageDialog({
  pipelineId,
  open,
  onOpenChange,
}: CreateStageDialogProps) {
  const { createStage } = useStageMutations(pipelineId);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#3b82f6');

  const handleCreateStageSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = newStageName.trim();
      if (!trimmedName) return;

      let validatedColor = newStageColor.trim();
      if (!validatedColor.startsWith('#')) {
        validatedColor = `#${validatedColor}`;
      }

      createStage.mutate(
        { name: trimmedName, color: validatedColor },
        {
          onSuccess: () => {
            setNewStageName('');
            setNewStageColor('#3b82f6');
            onOpenChange(false);
          },
        }
      );
    },
    [createStage, newStageColor, newStageName, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] border-none shadow-2xl bg-background text-foreground rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Новый этап воронки
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreateStageSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label
              htmlFor="stage-name"
              className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest block mb-1"
            >
              Название колонки
            </label>
            <Input
              id="stage-name"
              placeholder="Напр. Замер назначен, Думает"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              disabled={createStage.isPending}
              className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-10 text-sm"
              maxLength={50}
              autoComplete="off"
              required
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="stage-color-text"
              className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest block mb-1"
            >
              Цвет маркера этапа
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newStageColor}
                onChange={(e) => setNewStageColor(e.target.value)}
                disabled={createStage.isPending}
                aria-label="Выбрать цвет"
                className="w-10 h-10 rounded-xl border border-muted-foreground/20 cursor-pointer bg-transparent overflow-hidden shrink-0"
              />
              <Input
                id="stage-color-text"
                value={newStageColor.toUpperCase()}
                onChange={(e) => setNewStageColor(e.target.value)}
                disabled={createStage.isPending}
                placeholder="#3B82F6"
                className="bg-muted/30 border-none uppercase font-mono max-w-[120px] rounded-xl h-10 text-sm tracking-wider"
                maxLength={7}
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 gap-2 sm:gap-0 border-t border-muted/20">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
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
  );
}