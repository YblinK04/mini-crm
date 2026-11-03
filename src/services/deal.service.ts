import { prisma } from '@/lib/prisma';
import { Deal, Stage } from '@prisma/client';
import {
  CreateDealApiSchema,
  UpdateDealSchema,
  type CreateDealApiInput,
  type UpdateDealInput,
} from '@/lib/schemas';
import { events } from '@/lib/events';

export interface StageChangedPayload {
  deal: Deal;
  oldStageId: string;
  newStageId: string;
  newStage: Stage | null;
  organizationId: string;
  userId: string;
}

export class DealService {
  private prisma = prisma;

  private async validatePipelineAccess(
    pipelineId: string,
    organizationId: string,
  ): Promise<void> {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: {
        id: pipelineId,
        organizationId,
      },
    });

    if (!pipeline) {
      throw new Error(
        'Доступ к указанной воронке продаж ограничен или она не существует',
      );
    }
  }

  private async emitStageChanged(payload: StageChangedPayload): Promise<void> {
    try {
      await events.emit('deal.stageChanged', payload);
    } catch (error) {
      console.error('[deal.service] emit deal.stageChanged failed:', error);
    }
  }

  async create(
    data: CreateDealApiInput,
    organizationId: string,
    userId: string,
  ): Promise<Deal> {
    const validated = CreateDealApiSchema.parse(data);

    return await this.prisma.$transaction(async (tx) => {
      const lastDeal = await tx.deal.findFirst({
        where: {
          pipelineId: validated.pipelineId,
          stageId: validated.stageId,
          organizationId,
        },
        orderBy: { order: 'desc' },
      });
      const order = lastDeal ? lastDeal.order + 1 : 0;

      const deal = await tx.deal.create({
        data: {
          title: validated.title,
          description: validated.description ?? null,
          budget: validated.budget,
          priority: validated.priority,
          order,
          pipelineId: validated.pipelineId,
          stageId: validated.stageId,
          companyId: validated.companyId ?? null,
          organizationId,
          customFields: validated.customFields,
          contacts:
            validated.contactIds.length > 0
              ? { connect: validated.contactIds.map((id) => ({ id })) }
              : undefined,
        },
      });

      await tx.activityLog.create({
        data: {
          dealId: deal.id,
          userId,
          content: `Сделка успешно открыта. Начальный бюджет: ${validated.budget / 100} ₽.`,
        },
      });

      return deal;
    });
  }

  async update(
    data: UpdateDealInput,
    organizationId: string,
    userId: string,
  ): Promise<Deal> {
    const validateData = UpdateDealSchema.parse(data);
    const { id, contactIds, ...updateData } = validateData;

    const existingDeal = await this.prisma.deal.findFirst({
      where: { id, organizationId },
    });
    if (!existingDeal) {
      throw new Error('Сделка не найдена в текущем филиале');
    }

    const willChangeStage =
      updateData.stageId !== undefined &&
      updateData.stageId !== existingDeal.stageId;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (
        updateData.budget !== undefined &&
        existingDeal.budget !== updateData.budget
      ) {
        await tx.activityLog.create({
          data: {
            dealId: id,
            userId,
            content: `Бюджет изменен: ${existingDeal.budget / 100} ₽ → ${updateData.budget / 100} ₽`,
          },
        });
      }
      if (willChangeStage) {
        const stageInfo = await tx.stage.findMany({
          where: {
            id: { in: [existingDeal.stageId, updateData.stageId!] },
          },
          select: { id: true, name: true },
        });
        const oldName =
          stageInfo.find((s) => s.id === existingDeal.stageId)?.name ??
          existingDeal.stageId;
        const newName =
          stageInfo.find((s) => s.id === updateData.stageId)?.name ??
          updateData.stageId;

        await tx.activityLog.create({
          data: {
            dealId: id,
            userId,
            content: `Этап изменён: «${oldName}» → «${newName}»`,
          },
        });
      }

      return tx.deal.update({
        where: { id },
        data: {
          title: updateData.title,
          description: updateData.description,
          budget: updateData.budget,
          priority: updateData.priority,
          stageId: updateData.stageId,
          pipelineId: updateData.pipelineId,
          companyId: updateData.companyId,
          ...(updateData.customFields
            ? { customFields: updateData.customFields }
            : {}),
          contacts: contactIds
            ? { set: contactIds.map((cId) => ({ id: cId })) }
            : undefined,
          updatedAt: new Date(),
        },
      });
    });
    if (willChangeStage) {
      const newStage = await this.prisma.stage.findUnique({
        where: { id: updated.stageId },
      });

      await this.emitStageChanged({
        deal: updated,
        oldStageId: existingDeal.stageId,
        newStageId: updated.stageId,
        newStage,
        organizationId,
        userId,
      });
    }

    return updated;
  }

  async move(
    data: {
      dealId: string;
      newStageId: string;
      newOrder: number;
      pipelineId: string;
    },
    organizationId: string,
    userId: string,
  ): Promise<Deal> {
    const deal = await this.prisma.deal.findFirst({
      where: {
        id: data.dealId,
        organizationId,
      },
      include: { stage: true },
    });

    if (!deal) {
      throw new Error(
        'Указанная сделка не найдена в системе или доступ к ней ограничен',
      );
    }

    await this.validatePipelineAccess(data.pipelineId, organizationId);

    const targetStage = await this.prisma.stage.findFirst({
      where: {
        id: data.newStageId,
        pipelineId: data.pipelineId,
      },
    });

    if (!targetStage) {
      throw new Error(
        'Целевой этап не найден в указанной воронке продаж',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
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
            userId,
            content: `Этап изменен: "${deal.stage.name}" → "${targetStage.name}"`,
          },
        });
      }

      return tx.deal.update({
        where: {
          id: data.dealId,
          organizationId,
        },
        data: {
          stageId: newStageId,
          order: newOrder,
          pipelineId: data.pipelineId,
        },
      });
    });

    if (deal.stageId !== data.newStageId) {
      await this.emitStageChanged({
        deal: updated,
        oldStageId: deal.stageId,
        newStageId: updated.stageId,
        newStage: targetStage,
        organizationId,
        userId,
      });
    }

    return updated;
  }

  async delete(dealId: string, organizationId: string): Promise<Deal> {
    const deal = await this.prisma.deal.findFirst({
      where: { id: dealId, organizationId },
    });

    if (!deal) {
      throw new Error('Сделка не найдена в текущем филиале');
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.deal.updateMany({
        where: {
          pipelineId: deal.pipelineId,
          stageId: deal.stageId,
          organizationId,
          order: { gt: deal.order },
        },
        data: { order: { decrement: 1 } },
      });

      return await tx.deal.delete({ where: { id: dealId } });
    });
  }

  async getDealHistory(dealId: string, organizationId: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id: dealId, organizationId },
    });
    if (!deal) {
      throw new Error('Сделка не найдена в текущем филиале');
    }

    return await this.prisma.activityLog.findMany({
      where: { dealId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, image: true } },
      },
    });
  }
}

export const dealService = new DealService();