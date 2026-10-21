import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isPrismaNotFound } from "@/lib/errors";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const patchDealSchema = z.object({
  stageId: z.string().cuid().optional(),
  order: z.number().int().optional(),

  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  budget: z.number().min(0).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  customFields: z.record(z.string(), z.string()).optional(),

  contactIds: z.array(z.string().cuid()).optional(),
});

export const GET = auth(async (req, ctx) => {
  const organizationId = req.auth?.user?.organizationId;

  if (!organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: dealId } = await (ctx as unknown as RouteContext).params;

    const deal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId },
      include: {
        company: true,
        contacts: true,
        documents: { orderBy: { createdAt: 'desc' } },
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

    const jsonBody = await req.json().catch(() => null);
    if (!jsonBody) {
      return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
    }

    const parsedBody = patchDealSchema.safeParse(jsonBody);
    if (!parsedBody.success) {
      return NextResponse.json({
        error: "Некорректный формат переданных данных",
        details: parsedBody.error.flatten()
      }, { status: 400 });
    }

    const data = parsedBody.data;
    const existingDeal = await prisma.deal.findFirst({
      where: { id: dealId, organizationId },
      select: { id: true, pipelineId: true },
    });
    if (!existingDeal) {
      return NextResponse.json(
        { error: "Сделка не найдена в вашей организации" },
        { status: 404 },
      );
    }

    if (data.stageId) {
      const stage = await prisma.stage.findFirst({
        where: {
          id: data.stageId,
          pipelineId: existingDeal.pipelineId,
        },
        select: { id: true },
      });
      if (!stage) {
        return NextResponse.json(
          { error: "Этап не найден в пайплайне этой сделки" },
          { status: 400 },
        );
      }
    }

    if (data.contactIds && data.contactIds.length > 0) {
      const owned = await prisma.contact.findMany({
        where: {
          id: { in: data.contactIds },
          organizationId,
        },
        select: { id: true },
      });
      if (owned.length !== data.contactIds.length) {
        return NextResponse.json(
          { error: "Некоторые контакты не найдены в вашей организации" },
          { status: 400 },
        );
      }
    }

    const updateData = {
      ...(data.stageId !== undefined && { stageId: data.stageId }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.budget !== undefined && { budget: data.budget }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.customFields !== undefined && { customFields: data.customFields }),
    };

    if (Object.keys(updateData).length === 0 && data.contactIds === undefined) {
      return NextResponse.json({ error: "Отсутствуют поля для обновления" }, { status: 400 });
    }

    const updatedDeal = await prisma.deal.update({
      where: { id: dealId, organizationId },
      data: {
        ...updateData,
        ...(data.contactIds !== undefined && {
          contacts: {
            set: data.contactIds.map((cId) => ({ id: cId })),
          },
        }),
      },
      include: {
        contacts: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedDeal });
  } catch (error: unknown) {
    console.error(`[CRM_API_DEAL_PATCH_FAILED]`, error);

    if (isPrismaNotFound(error)) {
      return NextResponse.json(
        { error: "Сделка не найдена в вашей организации" },
        { status: 404 },
      );
    }

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
      where: { id: dealId, organizationId },
      select: { id: true, title: true },
    });
    if (!existingDeal) {
      return NextResponse.json({ error: "Сделка не найдена или доступ ограничен" }, { status: 404 });
    }

    await prisma.deal.delete({
      where: { id: dealId, organizationId },
    });

    try {
      await prisma.notification.create({
        data: {
          userId,
          title: "Сделка удалена 🗑️",
          message: `Сделка "${existingDeal.title}" была успешно удалена менеджером.`,
        },
      });
    } catch (notifyError) {
      console.error("[CRM_API_DEAL_DELETE_NOTIFY_FAILED]", notifyError);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(`[CRM_API_DEAL_DELETE_CRITICAL_FAILED]`, error);

    if (isPrismaNotFound(error)) {
      return NextResponse.json(
        { error: "Сделка не найдена или доступ ограничен" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Не удалось удалить сделку из-за ограничений СУБД" },
      { status: 500 },
    );
  }
});