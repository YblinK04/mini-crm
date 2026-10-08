
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { taskService } from '@/services/task.service';
import { NotFoundError } from '@/lib/errors';

const IdSchema = z.string().cuid();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const idParsed = IdSchema.safeParse(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { organizationId } = session.user;

  try {
    const task = await taskService.update(idParsed.data, organizationId, body);
    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('[tasks PATCH]', { id, organizationId, error });
    return NextResponse.json(
      { error: 'Не удалось обновить задачу' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const idParsed = IdSchema.safeParse(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  }

  const { organizationId } = session.user;

  try {
    await taskService.delete(idParsed.data, organizationId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('[tasks DELETE]', { id, organizationId, error });
    return NextResponse.json(
      { error: 'Не удалось удалить задачу' },
      { status: 500 },
    );
  }
}