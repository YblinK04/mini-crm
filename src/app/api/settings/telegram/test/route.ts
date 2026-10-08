
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import {
  getMe,
  TelegramApiError,
} from '@/lib/channels/telegram/client';

function isAdminSession(session: Session | null): boolean {
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === 'ADMIN' || role === 'OWNER';
}

export async function POST(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const settings = await getSettings();
  if (!settings?.telegramBotToken) {
    return NextResponse.json(
      { error: 'Сначала сохраните токен бота' },
      { status: 400 },
    );
  }

  try {
    const me = await getMe(settings.telegramBotToken);

    return NextResponse.json({
      ok: true,
      bot: {
        id: me.id,
        username: me.username ?? null,
        firstName: me.first_name,
      },
    });
  } catch (error) {
    if (error instanceof TelegramApiError && error.errorCode === 401) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Telegram отверг токен (401). Проверьте, что токен актуален.',
          details: error.description,
        },
        { status: 400 },
      );
    }

    console.error('[settings/telegram/test]', error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Не удалось связаться с Telegram',
      },
      { status: 502 },
    );
  }
}