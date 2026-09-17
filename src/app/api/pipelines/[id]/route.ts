import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pipelineService } from '@/services/pipeline.service'; 

interface RouteContext {
  params: Promise<{
    id: string; 
  }>;
}

export async function PATCH(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Пользователь не авторизован' }, { status: 401 });
    }

    const { organizationId } = session.user;
    const { id: pipelineId } = await context.params; 
    
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Некорректный JSON тела запроса' }, { status: 400 });
    }

    const { action, name, color, stageId } = body;

    if (action === 'UPDATE_STAGE') {
      if (!stageId) {
        return NextResponse.json({ error: 'Параметр stageId обязателен' }, { status: 400 });
      }
      const updatedStage = await pipelineService.updateStage(
        String(stageId), 
        { name, color }, 
        organizationId
      );
      return NextResponse.json(updatedStage, { status: 200 });
    }

    if (action === 'CREATE_STAGE') {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Название колонки не может быть пустым' }, { status: 400 });
      }
      const newStage = await pipelineService.createStage(
        { name: String(name), color: color ? String(color) : undefined, pipelineId },
        organizationId
      );
      return NextResponse.json(newStage, { status: 201 });
    }

    return NextResponse.json({ error: 'Неизвестное действие (action)' }, { status: 400 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестный сбой СУБД';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


export async function DELETE(
  request: Request,
  context: RouteContext
): Promise<Response> {
  console.log('🛑 [ROUTE_DELETE_TRIGGER] Запрос на удаление колонки ДОШЕЛ до роута!');

  try {
    const session = await auth();
    console.log('👤 [ROUTE_DELETE_AUTH] Сессия из Auth.js:', {
      hasSession: Boolean(session),
      userId: session?.user?.id,
      organizationId: session?.user?.organizationId,
    });

    const organizationId = session?.user?.organizationId || 'NOT_FOUND_IN_SESSION';
    
    const { id: pipelineId } = await context.params; 
    console.log('📍 [ROUTE_DELETE_URL_PARAMS] pipelineId из URL:', pipelineId);

    const { searchParams } = new URL(request.url);
    const stageId = searchParams.get('stageId');
    console.log('📋 [ROUTE_DELETE_QUERY_PARAMS] stageId из строки запроса:', stageId);

    if (!stageId) {
      console.warn('⚠️ [ROUTE_DELETE_ABORT] Отмена: Не передан stageId');
      return NextResponse.json({ error: 'Идентификатор колонки (stageId) обязателен' }, { status: 400 });
    }

    console.log(`🚀 [ROUTE_DELETE_SERVICE_CALL] Передаем в pipelineService.deleteStage параметры:`, {
      stageId,
      organizationId
    });

    const result = await pipelineService.deleteStage(stageId, organizationId);
    
    console.log('✅ [ROUTE_DELETE_SUCCESS] Сервис успешно выполнил удаление:', result);
    return NextResponse.json(result, { status: 200 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления этапа';
    
    console.error('❌ [ROUTE_DELETE_CATCH_ERROR] Перехвачена ошибка в роуте:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack'
    });

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
