'use server';

import { auth } from '@/lib/auth';
import { pipelineService } from '@/services/pipeline.service';
import { revalidatePath } from 'next/cache';

export async function createPipelineAction(formData: { name: string }) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Пользователь не авторизован' };
  }

  const { organizationId } = session.user;

  try {
    const pipeline = await pipelineService.create(formData, organizationId);
    revalidatePath('/dashboard');
    return { success: true, data: pipeline };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Системная ошибка';
    return { success: false, error: 'Не удалось создать воронку продаж.' };
  }
}

export async function deletePipelineAction(pipelineId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Пользователь не авторизован' };
  }

  const { organizationId } = session.user;

  try {
    const deletedPipeline = await pipelineService.delete(pipelineId, organizationId);
    revalidatePath('/dashboard');
    return { success: true, data: deletedPipeline };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Ошибка СУБД';
    return { success: false, error: errorMessage || 'Не удалось удалить воронку.' };
  }
}
