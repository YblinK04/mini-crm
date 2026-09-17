'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { UpdateProfileSchema } from '@/lib/schemas';

export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export async function updateProfile(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return { error: 'Не авторизован' };

  const name = formData.get('name') as string;
  
  const validated = UpdateProfileSchema.safeParse({ name });
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name: validated.data.name },
    });

    revalidatePath('/', 'layout');
    
    return { success: true };
  } catch (e: unknown) {
    return { error: 'Ошибка при сохранении в базу данных' };
  }
}