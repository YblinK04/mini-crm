'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;

  onConfirm: () => void;
  isPending?: boolean;
}

export function TaskDeleteConfirmDialog({
  open,
  onOpenChange,
  taskTitle,
  onConfirm,
  isPending = false,
}: Props) {
  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] border-none shadow-2xl bg-background text-foreground rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">
            Удалить задачу?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground break-words">
            «{taskTitle}» будет удалена. После подтверждения действие
            можно отменить в течение 3 секунд.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4 gap-2">
          <Button
            type="button"
            variant="ghost"
            autoFocus
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-xl text-xs font-semibold"
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-xl text-xs font-semibold"
          >
            {isPending ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}