
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { taskService } from '@/services/task.service';
import { NotFoundError } from '@/lib/errors';


const QuerySchema = z
  .object({
    view: z.enum(['today']).optional(),
    daysAhead: z.coerce.number().int().min(0).max(30).optional().default(1),
    dealId: z.string().cuid().optional(),
    contactId: z.string().cuid().optional(),
  })
  .refine((q) => q.view || q.dealId || q.contactId, {
    message: 'Укажите view, dealId или contactId',
  })
  .refine((q) => !(q.dealId && q.contactId), {
    message: 'Укажите либо dealId, либо contactId',
  });


export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;
  const { searchParams } = new URL(request.url);

  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { view, daysAhead, dealId, contactId } = parsed.data;

  try {
    if (view === 'today') {
      const data = await taskService.getUpcoming(organizationId, daysAhead);
      return NextResponse.json(data);
    }
    if (dealId) {
      const data = await taskService.findByDeal(dealId, organizationId);
      return NextResponse.json(data);
    }
    if (contactId) {
      const data = await taskService.findByContact(contactId, organizationId);
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  } catch (error) {
    console.error('[tasks GET]', { organizationId, error });
    return NextResponse.json(
      { error: 'Не удалось загрузить задачи' },
      { status: 500 },
    );
  }
}



export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    
    const task = await taskService.create(
      body,
      session.user.organizationId,
      session.user.id,
    );
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message, resource: error.resource },
        { status: 400 },
      );
    }
    console.error('[tasks POST]', {
      organizationId: session.user.organizationId,
      userId: session.user.id,
      error,
    });
    return NextResponse.json(
      { error: 'Не удалось создать задачу' },
      { status: 500 },
    );
  }
}