import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pipelineService } from '@/services/pipeline.service';
import { requireOwnerOrAdmin } from '@/lib/auth-helpers';

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
    const denied = requireOwnerOrAdmin(session);
    if (denied) return denied;

    const organizationId = session?.user?.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Пользователь не авторизован' }, { status: 401 });
    }

    const { id: pipelineId } = await context.params;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Некорректный JSON тела запроса' }, { status: 400 });
    }

    const { action, name, color, stageId, autoTaskTitle, autoTaskDays } = body;

    if (action === 'UPDATE_STAGE') {
      if (!stageId) {
        return NextResponse.json({ error: 'Параметр stageId обязателен' }, { status: 400 });
      }
      const updatedStage = await pipelineService.updateStage(
        String(stageId),
        {
          name,
          color,
          autoTaskTitle: autoTaskTitle ?? null,
          autoTaskDays: autoTaskDays ?? null,
        },
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
  try {
    const session = await auth();
    const denied = requireOwnerOrAdmin(session);
    if (denied) return denied;

    const organizationId = session?.user?.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Пользователь не авторизован' }, { status: 401 });
    }

    const { id: pipelineId } = await context.params;

    const { searchParams } = new URL(request.url);
    const stageId = searchParams.get('stageId');

    if (!stageId) {
      return NextResponse.json(
        { error: 'Идентификатор колонки (stageId) обязателен' },
        { status: 400 }
      );
    }

    const result = await pipelineService.deleteStage(stageId, organizationId);

    return NextResponse.json(result, { status: 200 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления этапа';
    console.error('[ROUTE_PIPELINES_DELETE_ERROR]', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack',
    });
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}