import { prisma } from '@/lib/prisma';
import { Deal } from '@prisma/client';
import { 
  CreateDealSchema, 
  UpdateDealSchema, 
  type CreateDealInput, 
  type UpdateDealInput 
} from '@/lib/schemas';

export class DealService {
  private prisma = prisma;

  
  private async validatePipelineAccess(pipelineId: string, organizationId: string): Promise<void> {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: {
        id: pipelineId,
        organizationId: organizationId
      }
    });

    if (!pipeline) {
      throw new Error('Доступ к указанной воронке продаж ограничен или она не существует');
    }
  }

  
  async create(data: CreateDealInput, organizationId: string, userId: string): Promise<Deal> {
    const validateData = CreateDealSchema.parse(data);

    return await this.prisma.$transaction(async (tx) => {
      const lastDeal = await tx.deal.findFirst({
        where: {
          pipelineId: validateData.pipelineId,
          stageId: validateData.stageId,
          organizationId: organizationId, 
        },
        orderBy: { order: 'desc' },
      });
      const order = lastDeal ? lastDeal.order + 1 : 0;

      const deal = await tx.deal.create({
        data: {
          title: validateData.title,
          description: validateData.description || null,
          budget: validateData.budget, 
          priority: validateData.priority || 'MEDIUM',
          order,
          pipelineId: validateData.pipelineId,
          stageId: validateData.stageId,
          companyId: validateData.companyId || null,
          organizationId: organizationId, 
          customFields: validateData.customFields || {},
          contacts: validateData.contactIds && validateData.contactIds.length > 0 
            ? { connect: validateData.contactIds.map(id => ({ id })) }
            : undefined,
        },
      });

      await tx.activityLog.create({
        data: {
          dealId: deal.id,
          userId: userId,
          content: `Сделка успешно открыта. Начальный бюджет: ${validateData.budget / 100} ₽.`,
        },
      });

      return deal;
    });
  }

 
  async update(data: UpdateDealInput, organizationId: string, userId: string): Promise<Deal> {
    const validateData = UpdateDealSchema.parse(data);
    const { id, contactIds, ...updateData } = validateData;

    const existingDeal = await this.prisma.deal.findFirst({ 
      where: { id, organizationId } 
    });
    if (!existingDeal) throw new Error('Сделка не найдена в текущем филиале');

    return await this.prisma.$transaction(async (tx) => {
      if (updateData.budget !== undefined && existingDeal.budget !== updateData.budget) {
        await tx.activityLog.create({
          data: {
            dealId: id,
            userId: userId,
            content: `Бюджет изменен: ${existingDeal.budget / 100} ₽ → ${updateData.budget / 100} ₽`,
          },
        });
      }

      return await tx.deal.update({
        where: { id },
        data: {
          title: updateData.title,
          description: updateData.description,
          budget: updateData.budget,
          priority: updateData.priority,
          stageId: updateData.stageId,
          pipelineId: updateData.pipelineId,
          companyId: updateData.companyId,
          ...(updateData.customFields ? { customFields: updateData.customFields } : {}),
          contacts: contactIds 
            ? { set: contactIds.map(cId => ({ id: cId })) } 
            : undefined,
          updatedAt: new Date(),
        },
      });
    });
  }
 
 
  async move(data: { dealId: string; newStageId: string; newOrder: number; pipelineId: string }, organizationId: string, userId: string): Promise<Deal> {
    
    const deal = await this.prisma.deal.findFirst({
      where: { 
        id: data.dealId, 
        organizationId: organizationId 
      },
      include: { stage: true }
    });

    if (!deal) {
      throw new Error('Указанная сделка не найдена в системе или доступ к ней ограничен');
    }

    await this.validatePipelineAccess(data.pipelineId, organizationId);

    const targetStage = await this.prisma.stage.findFirst({
      where: { 
        id: data.newStageId,
        pipelineId: data.pipelineId
      }
    });

    return await this.prisma.$transaction(async (tx) => {
      const oldStageId = deal.stageId;
      const newStageId = data.newStageId;
      const oldOrder = deal.order;
      const newOrder = data.newOrder;
      
      if (oldStageId === newStageId) {
        if (oldOrder !== newOrder) {
          if (newOrder > oldOrder) {
            await tx.deal.updateMany({
              where: {
                stageId: oldStageId,
                pipelineId: data.pipelineId,
                organizationId,
                order: { gt: oldOrder, lte: newOrder },
              },
              data: { order: { decrement: 1 } },
            });
          } else {
            await tx.deal.updateMany({
              where: {
                stageId: oldStageId,
                pipelineId: data.pipelineId,
                organizationId,
                order: { gte: newOrder, lt: oldOrder },
              },
              data: { order: { increment: 1 } },
            });
          }
        }
      } else {
        await tx.deal.updateMany({
          where: {
            stageId: oldStageId,
            pipelineId: deal.pipelineId,
            organizationId,
            order: { gt: oldOrder },
          },
          data: { order: { decrement: 1 } },
        });

        await tx.deal.updateMany({
          where: {
            stageId: newStageId,
            pipelineId: data.pipelineId,
            organizationId,
            order: { gte: newOrder },
          },
          data: { order: { increment: 1 } },
        });

        await tx.activityLog.create({
          data: {
            dealId: deal.id,
            userId: userId,
            content: `Этап изменен: "${deal.stage.name}" → "${targetStage?.name || 'Неизвестно'}"`,
          },
        });
      }

      return await tx.deal.update({
        where: { 
          id: data.dealId,
          organizationId: organizationId
        },
        data: {
          stageId: newStageId,
          order: newOrder,
          pipelineId: data.pipelineId,
        },
      });
    });
  }

  async delete(dealId: string, organizationId: string): Promise<Deal> {
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId },
    });

    if (!deal) throw new Error('Сделка не найдена в текущем филиале');

    return await prisma.$transaction(async (tx) => {
      await tx.deal.updateMany({
        where: {
          pipelineId: deal.pipelineId,
          stageId: deal.stageId,
          organizationId,
          order: { gt: deal.order },
        },
        data: { order: { decrement: 1 } },
      });

      // Локальные файлы и логи активности удалятся автоматически благодаря onDelete: Cascade на уровне СУБД
      return await tx.deal.delete({ where: { id: dealId } });
    });
  }

  
  async getDealHistory(dealId: string, organizationId: string) {
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId },
    });
    if (!deal) throw new Error('Сделка не найдена в текущем филиале');

    return await prisma.activityLog.findMany({
      where: { dealId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, image: true } }
      }
    });
  }
}

export const dealService = new DealService();
