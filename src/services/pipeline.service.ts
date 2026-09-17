import { PrismaClient, Pipeline, Stage, Prisma } from '@prisma/client';
import { prisma as globalPrisma } from '@/lib/prisma';
import { CreatePipelineSchema, type CreatePipelineInput } from '@/lib/schemas';

export function parseJsonRecord(
  value: Prisma.JsonValue | null | undefined,
): Record<string, string> {
  if (value === null || value === undefined) return {};
  if (typeof value !== 'object' || Array.isArray(value)) return {};

  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

export type PrismaTransactionContext = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

type PrismaDealRow = Prisma.DealGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
    budget: true;
    priority: true;
    order: true;
    closeDate: true;
    pipelineId: true;
    stageId: true;
    assigneeId: true;
    companyId: true;
    organizationId: true;
    customFields: true;
    createdAt: true;
    updatedAt: true;
    company: { select: { name: true } };
    contacts: { select: { id: true; firstName: true; phone: true } };
    assignee: { select: { id: true; name: true; email: true; image: true } };
  };
}>;
type DealDTO = Omit<PrismaDealRow, 'budget' | 'customFields'> & {
  budget: number;
  customFields: Record<string, string>;
};

type StageDTO = Stage & {
  totalBudget: number;
  deals: DealDTO[];
};

export interface PipelineDataDTO
  extends Omit<Pipeline, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
  stages: StageDTO[];
}

export class PipelineService {
  private prisma: PrismaClient;

  constructor(prismaInstance: PrismaClient = globalPrisma) {
    this.prisma = prismaInstance;
  }

  async create(
    data: CreatePipelineInput,
    organizationId: string,
  ): Promise<Pipeline> {
    const validated = CreatePipelineSchema.parse(data);

    return await this.prisma.$transaction(async (tx) => {
      const newPipeline = await tx.pipeline.create({
        data: {
          name: validated.name.trim(),
          organizationId,
        },
      });

      const defaultStages = [
        { name: 'Новая заявка', color: '#3b82f6', order: 0 },
        { name: 'Переговоры / Квалификация', color: '#f59e0b', order: 1 },
        { name: 'КП / Смета отправлена', color: '#8b5cf6', order: 2 },
        { name: 'Согласование / Договор', color: '#ec4899', order: 3 },
        { name: 'Успешно реализовано 👑', color: '#10b981', order: 4 },
        { name: 'Отказ / Не реализовано', color: '#ef4444', order: 5 },
      ];

      await tx.stage.createMany({
        data: defaultStages.map((stage) => ({
          ...stage,
          pipelineId: newPipeline.id,
        })),
      });

      return newPipeline;
    });
  }

  async delete(pipelineId: string, organizationId: string): Promise<Pipeline> {
    const dealsCount = await this.prisma.deal.count({
      where: { pipelineId, organizationId },
    });

    if (dealsCount > 0) {
      throw new Error(
        'Категорически запрещено удалять воронку, в которой содержатся сделки.',
      );
    }

    try {
      return await this.prisma.pipeline.delete({
        where: { id: pipelineId, organizationId },
      });
    } catch {
      throw new Error('Воронка продаж не найдена или уже удалена.');
    }
  }

  async getPipelineData(
    pipelineId: string,
    organizationId: string,
  ): Promise<PipelineDataDTO> {
    try {
      const [pipeline, budgetAggregations] = await Promise.all([
        this.prisma.pipeline.findFirst({
          where: { id: pipelineId, organizationId },
          include: {
            stages: {
              orderBy: { order: 'asc' },
              include: {
                deals: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    budget: true,
                    priority: true,
                    order: true,
                    closeDate: true,
                    pipelineId: true,
                    stageId: true,
                    assigneeId: true,
                    companyId: true,
                    organizationId: true,
                    customFields: true,
                    createdAt: true,
                    updatedAt: true,
                    company: { select: { name: true } },
                    contacts: {
                      select: { id: true, firstName: true, phone: true },
                    },
                    assignee: {
                      select: { id: true, name: true, email: true, image: true },
                    },
                  },
                },
              },
            },
          },
        }),

        this.prisma.deal.groupBy({
          by: ['stageId'],
          where: { pipelineId, organizationId },
          _sum: { budget: true },
        }),
      ]);

      if (!pipeline) {
        throw new Error(
          'Указанная воронка продаж не найдена в системе или доступ к ней ограничен.',
        );
      }

      const budgetMap = new Map<string, number>();
      budgetAggregations.forEach((item) => {
        budgetMap.set(item.stageId, Number(item._sum.budget ?? 0));
      });

      const stagesWithBudgets: StageDTO[] = pipeline.stages.map((stage) => {
        const sortedDeals = [...stage.deals].sort((a, b) => a.order - b.order);

        const deals: DealDTO[] = sortedDeals.map((deal) => ({
          ...deal,
          budget: Number(deal.budget),
          customFields: parseJsonRecord(deal.customFields),
        }));

        return {
          ...stage,
          totalBudget: budgetMap.get(stage.id) ?? 0,
          deals,
        };
      });

      return {
        ...pipeline,
        stages: stagesWithBudgets,
      };
    } catch (error) {
      console.error(
        ` [CRM_PIPELINE_DATA_CRITICAL] Ошибка сборки Kanban-данных для воронки ${pipelineId}:`,
        error,
      );
      throw new Error(
        'Не удалось загрузить данные Kanban-доски. Ошибка локальной СУБД.',
      );
    }
  }

  async getOrganizationPipelines(organizationId: string): Promise<Pipeline[]> {
    try {
      return await this.prisma.pipeline.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      console.error(' [CRM_API_GET_ORG_PIPELINES_FAILED]', error);
      return [];
    }
  }

  async createStage(
    data: { name: string; color?: string; pipelineId: string },
    organizationId: string,
    txContext?: PrismaTransactionContext,
  ): Promise<Stage> {
    const executeAction = async (tx: PrismaTransactionContext) => {
      const pipeline = await tx.pipeline.findFirst({
        where: {
          id: data.pipelineId,
          OR: [
            { organizationId },
            { organizationId: 'local' },
            { organizationId: '' },
          ],
        },
        select: { id: true },
      });

      if (!pipeline) {
        throw new Error(
          'Указанная воронка продаж не найдена в вашей организации',
        );
      }

      const trimmedName = data.name.trim();
      if (!trimmedName) {
        throw new Error('Название колонки не может быть пустым');
      }

      const lastStage = await tx.stage.findFirst({
        where: { pipelineId: data.pipelineId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const nextOrder = lastStage ? lastStage.order + 1 : 0;

      return await tx.stage.create({
        data: {
          name: trimmedName,
          color: data.color?.trim() || '#3b82f6',
          order: nextOrder,
          pipelineId: data.pipelineId,
        },
      });
    };

    return txContext
      ? executeAction(txContext)
      : await this.prisma.$transaction(async (tx) => executeAction(tx));
  }

  async updateStage(
    stageId: string,
    data: { name?: string; color?: string },
    organizationId: string,
    txContext?: PrismaTransactionContext,
  ): Promise<Stage> {
    const client = txContext || this.prisma;

    const stage = await client.stage.findFirst({
      where: {
        id: stageId,
        pipeline: {
          OR: [
            { organizationId },
            { organizationId: 'local' },
            { organizationId: '' },
          ],
        },
      },
      select: { id: true },
    });

    if (!stage) {
      throw new Error('Этап воронки не найден или доступ к нему ограничен');
    }

    let updatedName: string | undefined;
    if (data.name !== undefined) {
      updatedName = data.name.trim();
      if (!updatedName) {
        throw new Error(
          'Название колонки при обновлении не может быть пустым',
        );
      }
    }

    return await client.stage.update({
      where: { id: stageId },
      data: {
        name: updatedName,
        color: data.color?.trim() || undefined,
      },
    });
  }

  async deleteStage(
    stageId: string,
    organizationId: string,
    txContext?: PrismaTransactionContext,
  ): Promise<{ success: boolean }> {
    const executeAction = async (tx: PrismaTransactionContext) => {
      const stage = await tx.stage.findFirst({
        where: {
          id: stageId,
          pipeline: {
            OR: [
              { organizationId },
              { organizationId: 'local' },
              { organizationId: '' },
            ],
          },
        },
        select: { id: true, pipelineId: true, order: true },
      });

      if (!stage) {
        throw new Error(
          'Этап воронки не найден или у вас нет прав на его удаление. Проверьте ID организации в БД.',
        );
      }

      const activeDealsInStage = await tx.deal.count({
        where: { stageId },
      });

      if (activeDealsInStage > 0) {
        throw new Error(
          `Запрещено удалять этап, внутри которого находятся сделки (${activeDealsInStage} шт.). Перенесите карточки в другие колонки доски.`,
        );
      }

      await tx.stage.delete({
        where: { id: stageId },
      });

      await tx.stage.updateMany({
        where: {
          pipelineId: stage.pipelineId,
          order: { gt: stage.order },
        },
        data: {
          order: { decrement: 1 },
        },
      });

      return { success: true };
    };

    return txContext
      ? executeAction(txContext)
      : await this.prisma.$transaction(async (tx) => executeAction(tx));
  }
}

export const pipelineService = new PipelineService();