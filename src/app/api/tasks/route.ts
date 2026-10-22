import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { taskService } from '@/services/task.service';
import { CreateTaskSchema } from '@/lib/schemas';
import { NotFoundError } from '@/lib/errors';


const TasksQuerySchema = z
  .object({
    view: z.enum(['today', 'all']).optional(),
    daysAhead: z.coerce
      .number()
      .int()
      .min(0)
      .max(30)
      .optional()
      .default(1),
    dealId: z.string().cuid().optional(),
    contactId: z.string().cuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine(
    (q) => {
      const active = [
        q.view !== undefined,
        q.dealId !== undefined,
        q.contactId !== undefined,
      ].filter(Boolean).length;
      return active <= 1;
    },
    {
      message: 'Укажите только один из параметров: view, dealId, contactId',
    },
  );

const MAX_ALL_TASKS = 1000;


export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;
  const { searchParams } = new URL(request.url);

  const parsedQuery = TasksQuerySchema.safeParse(
    Object.fromEntries(searchParams),
  );
  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsedQuery.error.flatten() },
      { status: 422 },
    );
  }

  const { view, daysAhead, dealId, contactId, from, to } = parsedQuery.data;

  try {
    if (view === 'today') {
      const data = await taskService.getUpcoming(organizationId, daysAhead);
      return NextResponse.json(data);
    }

    if (view === 'all') {
      const where: Prisma.TaskWhereInput = { organizationId };

      if (from || to) {
        where.dueAt = {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        };
      }

      const data = await prisma.task.findMany({
        where,
        orderBy: { dueAt: 'asc' },
        take: MAX_ALL_TASKS,
        include: {
          deal: { select: { id: true, title: true, pipelineId: true } },
        },
      });
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

    return NextResponse.json(
      { error: 'Укажите view, dealId или contactId' },
      { status: 400 },
    );
  } catch (error: unknown) {
    console.error('[tasks GET]', {
      organizationId,
      view,
      dealId,
      contactId,
      from,
      to,
      error,
    });
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

  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const task = await taskService.create(
      parsed.data,
      session.user.organizationId,
      session.user.id,
    );
    return NextResponse.json(task, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message, resource: error.resource },
        { status: 400 },
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten() },
        { status: 422 },
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