'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';

export interface SidebarPipeline {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export function useSidebarProjects(initialPipelines: SidebarPipeline[]) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const { data: pipelines = initialPipelines, isLoading } = useQuery<SidebarPipeline[]>({
    queryKey: ['pipelines'],
    queryFn: async () => {
      const response = await fetch('/api/pipelines');
      if (!response.ok) {
        throw new Error('Не удалось загрузить списки воронок продаж');
      }
      return response.json();
    },
    initialData: initialPipelines,
    staleTime: 1000 * 60 * 5, 
  });

  const { mutate: deletePipeline } = useMutation({
    mutationKey: ['pipelines', 'delete'],
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/pipelines/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Не удалось удалить воронку');
      }
      return response.json();
    },
    onSuccess: (_, deletedPipelineId) => {
      const isCurrentPipeline = pathname.includes(deletedPipelineId);

      toast.success('Воронка продаж полностью удалена');

      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      if (isCurrentPipeline) {
        router.push('/dashboard');
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Критическая ошибка при удалении';
      toast.error(message);
      console.error('[CRM_PIPELINE_DELETE_FAILED]', error);
    }
  });

  return {
    activeProjects: pipelines, 
    completedProjects: [], 
    deleteProject: deletePipeline,
    projects: pipelines,
    isLoading
  };
}
