import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pipelineService } from '@/services/pipeline.service';
import { CreatePipelineSchema } from '@/lib/schemas';


export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Пользователь не авторизован в системе или отсутствует привязка к организации' }, 
        { status: 401 }
      );
    }

    const { organizationId } = session.user;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Некорректный или пустой формат JSON тела запроса' }, 
        { status: 400 }
      );
    }

    const validatedFields = CreatePipelineSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          error: 'Ошибка валидации названия воронки продаж', 
          details: validatedFields.error.flatten() 
        },
        { status: 422 } 
      );
    }

    const newPipeline = await pipelineService.create(validatedFields.data, organizationId);

    return NextResponse.json(newPipeline, { status: 201 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестный сбой локальной СУБД';

    console.error(
      JSON.stringify({
        context: 'CRM_API_PIPELINES_POST_CRITICAL_ERROR',
        message: 'Критический сбой при транзакционном создании воронки',
        timestamp: new Date().toISOString(),
        error: errorMessage
      })
    );

    return NextResponse.json(
      { error: errorMessage || 'Внутренняя ошибка локального сервера СУБД при создании воронки' }, 
      { status: 500 }
    );
  }
}
