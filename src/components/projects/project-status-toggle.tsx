'use client';

import { useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectStatusToggleProps {
  pipelineId: string;
  isArchived: boolean;
}

export function ProjectStatusToggle({ pipelineId, isArchived }: ProjectStatusToggleProps) {
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const handleToggleStatus = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/pipelines/${pipelineId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            isArchived: !isArchived 
          }),
        });

        if (!response.ok) {
          const errorMsg = await response.text().catch(() => 'Ошибка сервера');
          throw new Error(errorMsg || 'Не удалось изменить статус воронки');
        }

        await queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
        await queryClient.invalidateQueries({ queryKey: ['pipelines'] });

        toast.success(
          isArchived 
            ? 'Воронка продаж успешно возвращена из архива' 
            : 'Воронка продаж успешно отправлена в архив'
        );
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка СУБД';
        console.error(' [CRM_PIPELINE_TOGGLE_STATUS_FAILED]', errorMessage);
        
        toast.error(errorMessage || 'Произошла ошибка при изменении статуса');
      }
    });
  };

  return (
    <Button
      variant={isArchived ? "default" : "outline"}
      size="sm"
      disabled={isPending}
      onClick={handleToggleStatus}
      className="gap-2 font-medium text-xs select-none transition-all duration-200"
    >
      {isArchived ? (
        <RotateCcw className="w-3.5 h-3.5" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
      )}
      
      <span>
        {isPending 
          ? 'Обновление...' 
          : isArchived 
            ? 'Восстановить воронку' 
            : 'Архивировать воронку'
        }
      </span>
    </Button>
  );
}
