import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type CommentContext = {
  params: Promise<{ id: string }>;
};


export const POST = auth(async (req, ctx) => {
  const userId = req.auth?.user?.id;
  const organizationId = req.auth?.user?.organizationId;

  if (!userId || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: dealId } = await (ctx as CommentContext).params;
    const body = await req.json();
    const content = body?.content;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Текст заметки пуст" }, { status: 400 });
    }

    const existingDeal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        organizationId, // Жесткая изоляция филиалов внутри "коробки"
      },
    });

    if (!existingDeal) {
      return NextResponse.json({ error: "Сделка не найдена или доступ ограничен" }, { status: 404 });
    }

    const newLog = await prisma.activityLog.create({
      data: {
        dealId,
        userId,
        content: content.trim(),
      },
    });

    return NextResponse.json(newLog);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка сервера";
    console.error(` [CRM_API_COMMENT_CREATE_FAILED]`, message);
    return NextResponse.json({ error: "Не удалось сохранить заметку" }, { status: 500 });
  }
});
