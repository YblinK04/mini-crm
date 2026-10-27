import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = auth(async (req) => {
  const userId = req.auth?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json(notifications, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      }
    });
  } catch (error) {
    console.error('[NOTIFICATIONS_GET_ERROR]', { userId, error });
    return NextResponse.json(
      { error: "Не удалось загрузить уведомления" }, 
      { status: 500 }
    );
  }
});