'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function usePipelineMutations() {
  const queryClient = useQueryClient();

  const createPipeline = useMutation({
    mutationKey: ['pipelines', 'create'],
    mutationFn: async (data: { name: string }) => {
      const response = await fetch('/api/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Не удалось создать воронку продаж');
      }
      return response.json();
    },
    onSuccess: async (newPipeline) => {
      toast.success(`Воронка "${newPipeline.name}" успешно создана!`);
      await queryClient.invalidateQueries({ queryKey: ['pipelines'], exact: false });
    },
    onError: (error: Error) => toast.error(error.message || 'Ошибка при создании воронки'),
  });

  return { createPipeline };
}
