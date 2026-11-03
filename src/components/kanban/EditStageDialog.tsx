'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useStageMutations } from '@/store/mutations/useStageMutations';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const HEX_COLOR_REGEX = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
const DEFAULT_STAGE_COLOR = '#3b82f6';

interface EditStageDialogProps {
  pipelineId: string;
  stageId: string;
  initialName: string;
  initialColor: string | null;
  initialAutoTaskTitle?: string | null;
  initialAutoTaskDays?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStageDialog({
  pipelineId,
  stageId,
  initialName,
  initialColor,
  initialAutoTaskTitle = null,
  initialAutoTaskDays = null,
  open,
  onOpenChange,
}: EditStageDialogProps) {
  const { updateStage } = useStageMutations(pipelineId);
  const [editName, setEditName] = useState(initialName);
  const [editColor, setEditColor] = useState(initialColor || DEFAULT_STAGE_COLOR);
  const [autoTaskTitle, setAutoTaskTitle] = useState(initialAutoTaskTitle || '');
  const [autoTaskDays, setAutoTaskDays] = useState(
    initialAutoTaskDays?.toString() || '',
  );

  useEffect(() => {
    if (open) {
      setEditName(initialName);
      setEditColor(initialColor || DEFAULT_STAGE_COLOR);
      setAutoTaskTitle(initialAutoTaskTitle || '');
      setAutoTaskDays(initialAutoTaskDays?.toString() || '');
    }
  }, [open, initialName, initialColor, initialAutoTaskTitle, initialAutoTaskDays]);

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

    const trimmedAutoTitle = autoTaskTitle.trim();
    const parsedDays = autoTaskDays ? parseInt(autoTaskDays, 10) : null;

    if (trimmedAutoTitle && (!parsedDays || parsedDays < 1)) {
      toast.error('Укажите через сколько дней создавать задачу (минимум 1)');
      return;
    }

    if (parsedDays && !trimmedAutoTitle) {
      toast.error('Укажите название задачи (например: Позвонить клиенту)');
      return;
    }

    updateStage.mutate(
      {
        stageId,
        name: trimmedName,
        color: validatedColor,
        autoTaskTitle: trimmedAutoTitle || null,
        autoTaskDays: parsedDays,
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] max-h-[85vh] overflow-y-auto border-none shadow-2xl bg-background text-foreground rounded-2xl scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Настройка этапа воронки
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleEditStageSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label
              htmlFor="edit-stage-name"
              className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest block mb-1"
            >
              Название колонки
            </label>
            <Input
              id="edit-stage-name"
              placeholder="Название этапа"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={updateStage.isPending}
              className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-10 text-sm"
              maxLength={100}
              autoComplete="off"
              required
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="edit-stage-color"
              className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest block mb-1"
            >
              Цвет маркера этапа
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                disabled={updateStage.isPending}
                aria-label="Выбрать цвет"
                className="w-10 h-10 rounded-xl border border-muted-foreground/20 cursor-pointer bg-transparent overflow-hidden shrink-0"
              />
              <Input
                id="edit-stage-color"
                value={editColor.toUpperCase()}
                onChange={(e) => setEditColor(e.target.value)}
                disabled={updateStage.isPending}
                placeholder="#3B82F6"
                className="bg-muted/30 border-none uppercase font-mono max-w-[120px] rounded-xl h-10 text-sm tracking-wider"
                maxLength={7}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-muted/20 space-y-3">
            <div>
              <label
                htmlFor="edit-auto-task-title"
                className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest block mb-1"
              >
                Автозадача (необязательно)
              </label>
              <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                При переходе сделки в этот этап автоматически создастся задача.
                Например: «Позвонить клиенту», «Отправить счёт», «Напомнить о записи».
              </p>
              <Input
                id="edit-auto-task-title"
                placeholder="Например: Позвонить клиенту"
                value={autoTaskTitle}
                onChange={(e) => setAutoTaskTitle(e.target.value)}
                disabled={updateStage.isPending}
                className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-10 text-sm"
                maxLength={200}
                autoComplete="off"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="edit-auto-task-days"
                className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest block mb-1"
              >
                Через сколько дней
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-auto-task-days"
                  type="number"
                  placeholder="2"
                  value={autoTaskDays}
                  onChange={(e) => setAutoTaskDays(e.target.value)}
                  disabled={updateStage.isPending}
                  className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-10 text-sm w-24"
                  min={1}
                  max={365}
                />
                <span className="text-xs text-muted-foreground">
                  {autoTaskDays === '1' ? 'день' : 'дней'}
                </span>
              </div>
            </div>

            {autoTaskTitle && !autoTaskDays && (
              <p className="text-[11px] text-destructive">
                Укажите количество дней для создания задачи
              </p>
            )}
          </div>

          <DialogFooter className="pt-4 gap-2 sm:gap-0 border-t border-muted/20">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
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
  );
}