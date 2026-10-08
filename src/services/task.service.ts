
import { PrismaClient, Task } from '@prisma/client';
import { prisma as globalPrisma } from '@/lib/prisma';
import { CreateTaskSchema, UpdateTaskSchema } from '@/lib/schemas';
import { NotFoundError, isPrismaNotFound } from '@/lib/errors';

const MAX_LIST = 500;
type TaskWithDeal = Task & {
  deal: { id: string; title: string; pipelineId: string } | null;
};

export class TaskService {
  constructor(private prisma: PrismaClient = globalPrisma) {}

  async create(
    data: unknown,
    organizationId: string,
    createdById: string,
  ): Promise<Task> {
    const validated = CreateTaskSchema.parse(data);

    await this.assertRelationsBelongToOrg(organizationId, {
      dealId: validated.dealId,
      contactId: validated.contactId,
      assignedToId: validated.assignedToId,
    });

    return this.prisma.task.create({
      data: {
        organizationId,
        createdById,
        title: validated.title,
        description: validated.description ?? null,
        dueAt: validated.dueAt,
        dealId: validated.dealId ?? null,
        contactId: validated.contactId ?? null,
        assignedToId: validated.assignedToId ?? null,
      },
    });
  }

  async update(
    taskId: string,
    organizationId: string,
    data: unknown,
  ): Promise<Task> {
    const validated = UpdateTaskSchema.parse(data);

    await this.assertRelationsBelongToOrg(organizationId, {
      dealId: validated.dealId,
      contactId: validated.contactId,
      assignedToId: validated.assignedToId,
    });

    try {
      return await this.prisma.task.update({
        where: { id: taskId, organizationId },
        data: validated,
      });
    } catch (e) {
      if (isPrismaNotFound(e)) throw new NotFoundError('Task', taskId);
      throw e;
    }
  }

  async complete(taskId: string, organizationId: string): Promise<Task> {
    const result = await this.prisma.task.updateMany({
      where: { id: taskId, organizationId, completedAt: null },
      data: { completedAt: new Date() },
    });

    if (result.count === 0) {
      const existing = await this.prisma.task.findFirst({
        where: { id: taskId, organizationId },
      });
      if (!existing) throw new NotFoundError('Task', taskId);
      return existing;
    }

    return this.prisma.task.findFirstOrThrow({
      where: { id: taskId, organizationId },
    });
  }

  async uncomplete(taskId: string, organizationId: string): Promise<Task> {
    const existing = await this.prisma.task.findFirst({
      where: { id: taskId, organizationId },
    });
    if (!existing) throw new NotFoundError('Task', taskId);

    if (existing.completedAt === null) return existing;

    return this.prisma.task.update({
      where: { id: taskId, organizationId },
      data: { completedAt: null },
    });
  }

  async delete(taskId: string, organizationId: string): Promise<Task> {
    try {
      return await this.prisma.task.delete({
        where: { id: taskId, organizationId },
      });
    } catch (e) {
      if (isPrismaNotFound(e)) throw new NotFoundError('Task', taskId);
      throw e;
    }
  }

  async getUpcoming(
    organizationId: string,
    daysAhead = 1,
  ): Promise<{
    overdue: TaskWithDeal[];
    today: TaskWithDeal[];
    later: TaskWithDeal[];
  }> {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const endOfRange = new Date(startOfToday);
    endOfRange.setDate(endOfRange.getDate() + daysAhead + 1);

    const tasks = await this.prisma.task.findMany({
      where: {
        organizationId,
        completedAt: null,
        dueAt: { lt: endOfRange },
      },
      orderBy: { dueAt: 'asc' },
      take: MAX_LIST,
      include: {
        deal: { select: { id: true, title: true,  pipelineId: true  } },
      },
    });

    const overdue: TaskWithDeal[] = [];
    const today: TaskWithDeal[] = [];
    const later: TaskWithDeal[] = [];

    for (const t of tasks) {
      if (t.dueAt < startOfToday) {
        overdue.push(t);
      } else if (t.dueAt < endOfToday) {
        today.push(t);
      } else {
        later.push(t);
      }
    }

    return { overdue, today, later };
  }

  async findByDeal(
    dealId: string,
    organizationId: string,
  ): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { dealId, organizationId },
      orderBy: { dueAt: 'asc' },
      take: MAX_LIST,
    });
  }

  async findByContact(
    contactId: string,
    organizationId: string,
  ): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { contactId, organizationId },
      orderBy: { dueAt: 'asc' },
      take: MAX_LIST,
    });
  }


  private async assertRelationsBelongToOrg(
    organizationId: string,
    ids: {
      dealId?: string | null;
      contactId?: string | null;
      assignedToId?: string | null;
    },
  ): Promise<void> {
    const check = <T>(
      resource: string,
      id: string,
      promise: Promise<T>,
    ): Promise<T> =>
      promise.catch((e) => {
        if (isPrismaNotFound(e)) throw new NotFoundError(resource, id);
        throw e;
      });

    const checks: Promise<unknown>[] = [];

    if (ids.dealId) {
      checks.push(
        check(
          'Deal',
          ids.dealId,
          this.prisma.deal.findFirstOrThrow({
            where: { id: ids.dealId, organizationId },
            select: { id: true },
          }),
        ),
      );
    }

    if (ids.contactId) {
      checks.push(
        check(
          'Contact',
          ids.contactId,
          this.prisma.contact.findFirstOrThrow({
            where: { id: ids.contactId, organizationId },
            select: { id: true },
          }),
        ),
      );
    }

    if (ids.assignedToId) {
      checks.push(
        check(
          'User',
          ids.assignedToId,
          this.prisma.user.findFirstOrThrow({
            where: { id: ids.assignedToId, organizationId },
            select: { id: true },
          }),
        ),
      );
    }

    await Promise.all(checks);
  }
}

export const taskService = new TaskService();