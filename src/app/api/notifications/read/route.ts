import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const POST = auth(async (req) => {
  const userId = req.auth?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      },
    );
  } catch (error) {
    console.error('[NOTIFICATIONS_READ_POST_ERROR]', { userId, error });
    return NextResponse.json(
      { error: "Не удалось обновить уведомления" },
      { status: 500 },
    );
  }
});