'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { CreatePipelineInput } from '@/lib/schemas';

export interface Pipeline {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface UseCreatePipelineOptions {
  onSuccess: () => void;
}

export function useCreateProject({ onSuccess }: UseCreatePipelineOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<Pipeline, Error, CreatePipelineInput>({
    mutationKey: ['pipelines', 'create-mutation'],
    
    mutationFn: async (data: CreatePipelineInput) => {
      const response = await fetch('/api/pipelines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: data.name.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Не удалось создать воронку продаж');
      }

      return response.json();
    },
    
    onSuccess: (newPipeline) => {
      toast.success(`Воронка "${newPipeline.name}" успешно создана`);

      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      onSuccess();

      if (newPipeline.id) {
        router.push(`/pipelines/${newPipeline.id}`);
      }
    },
    
    onError: (error) => {
      toast.error(error.message || 'Критическая ошибка при создании воронки');
      console.error('[CRM_CREATE_PIPELINE_MUTATION_FAILED]', error);
    },
  });
}
