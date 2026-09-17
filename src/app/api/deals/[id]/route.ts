// src/app/api/deals/[id]/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const patchDealSchema = z.object({
  stageId: z.string().optional(),
  order: z.number().int().optional(),
  
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  budget: z.number().min(0).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  customFields: z.record(z.string(), z.string()).optional(),
});

export const GET = auth(async (req, ctx) => {
  const organizationId = req.auth?.user?.organizationId;

  if (!organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: dealId } = await (ctx as unknown as RouteContext).params;

    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        organizationId 
      },
      include: {
        company: true,
        contacts: true,
        documents: {
          orderBy: { createdAt: 'desc' }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true, image: true } }
          }
        },
        assignee: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    if (!deal) {
      return NextResponse.json({ error: "Сделка не найдена или доступ ограничен" }, { status: 404 });
    }

    return NextResponse.json(deal);
  } catch (error: unknown) {
    console.error(`[CRM_API_DEAL_GET_FAILED]`, error);
    return NextResponse.json({ error: "Не удалось загрузить данные сделки" }, { status: 500 });
  }
});

export const PATCH = auth(async (req, ctx) => {
  const userId = req.auth?.user?.id;
  const organizationId = req.auth?.user?.organizationId;

  if (!userId || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: dealId } = await (ctx as unknown as RouteContext).params;
    const jsonBody = await req.json();
    
    const parsedBody = patchDealSchema.safeParse(jsonBody);
    if (!parsedBody.success) {
      return NextResponse.json({ 
        error: "Некорректный формат переданных данных", 
        details: parsedBody.error.flatten() 
      }, { status: 400 });
    }

    const data = parsedBody.data;

    const checkDeal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId }
    });

    if (!checkDeal) {
      return NextResponse.json({ error: "Сделка не найдена в вашей организации" }, { status: 404 });
    }

    const updateData: Record<string, any> = {};

    if (data.stageId !== undefined) updateData.stageId = data.stageId;
    if (data.order !== undefined) updateData.order = data.order;

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.budget !== undefined) updateData.budget = data.budget;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.customFields !== undefined) updateData.customFields = data.customFields;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Отсутствуют поля для обновления" }, { status: 400 });
    }

    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedDeal });
  } catch (error: unknown) {
    console.error(`[CRM_API_DEAL_PATCH_FAILED]`, error);
    return NextResponse.json({ error: "Не удалось обновить данные сделки" }, { status: 500 });
  }
});

export const DELETE = auth(async (req, ctx) => {
  const userId = req.auth?.user?.id;
  const organizationId = req.auth?.user?.organizationId;
  if (!userId || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id: dealId } = await (ctx as unknown as RouteContext).params;
    if (!dealId) {
      return NextResponse.json({ error: "Идентификатор сделки не указан" }, { status: 400 });
    }
    const existingDeal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId }
    });
    if (!existingDeal) {
      return NextResponse.json({ error: "Сделка не найдена или доступ ограничен" }, { status: 404 });
    }
    
    
    const deletedDeal = await prisma.$transaction(async (tx) => {
      if ('activity' in tx) {
        await (tx as any).activity.deleteMany({ where: { dealId } });
      } else if ('dealActivity' in tx) {
        await (tx as any).dealActivity.deleteMany({ where: { dealId } });
      } else if ('activities' in tx) {
        await (tx as any).activities.deleteMany({ where: { dealId } });
      }

      if ('document' in tx) {
        await (tx as any).document.deleteMany({ where: { dealId } });
      } else if ('documents' in tx) {
        await (tx as any).documents.deleteMany({ where: { dealId } });
      }

      if ('comment' in tx) {
        await (tx as any).comment.deleteMany({ where: { dealId } });
      } else if ('comments' in tx) {
        await (tx as any).comments.deleteMany({ where: { dealId } });
      }

      return await tx.deal.delete({
        where: { id: dealId },
      });
    });

    await prisma.notification.create({
      data: {
        userId,
        title: "Сделка удалена 🗑️",
        message: `Сделка "${deletedDeal.title}" была успешно удалена менеджером.`,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(`[CRM_API_DEAL_DELETE_CRITICAL_FAILED]`, error);
    const msg = error instanceof Error ? error.message : "Внутренняя ошибка СУБД";
    return NextResponse.json({ error: "Не удалось удалить сделку из-за ограничений СУБД", details: msg }, { status: 500 });
  }
});