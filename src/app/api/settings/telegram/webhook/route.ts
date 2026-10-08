
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import {
  setWebhook,
  deleteWebhook,
  TelegramApiError,
} from '@/lib/channels/telegram/client';

function isAdminSession(session: Session | null): boolean {
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === 'ADMIN' || role === 'OWNER';
}

const SetSchema = z.object({
  baseUrl: z
    .string()
    .url('Некорректный URL')
    .refine((u) => u.startsWith('https://'), {
      message: 'Telegram принимает только HTTPS-адреса',
    }),
});

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = SetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const settings = await getSettings();
  if (!settings?.telegramBotToken || !settings.telegramWebhookSecret) {
    return NextResponse.json(
      { error: 'Сначала сохраните токен и секрет' },
      { status: 400 },
    );
  }

  const baseUrl = parsed.data.baseUrl.replace(/\/+$/, '');
  const publicUrl = process.env.PUBLIC_URL?.replace(/\/+$/, '');

  if (publicUrl && baseUrl !== publicUrl) {
    return NextResponse.json(
      {
        error: 'baseUrl must match PUBLIC_URL configured on the server',
        expected: publicUrl,
      },
      { status: 400 },
    );
  }

  const webhookUrl = `${baseUrl}/api/webhooks/telegram`;

  try {
    await setWebhook(
      settings.telegramBotToken,
      webhookUrl,
      settings.telegramWebhookSecret,
    );
    return NextResponse.json({ ok: true, url: webhookUrl });
  } catch (error) {
    if (error instanceof TelegramApiError && error.errorCode < 500) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Telegram отверг регистрацию webhook',
          details: error.description,
          code: error.errorCode,
        },
        { status: 400 },
      );
    }

    console.error(
      '[settings/telegram/webhook] setWebhook failed for',
      webhookUrl,
      error,
    );
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Не удалось установить webhook',
      },
      { status: 502 },
    );
  }
}

export async function DELETE(): Promise<Response> {
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
      { error: 'Токен бота не сохранён' },
      { status: 400 },
    );
  }

  try {
    await deleteWebhook(settings.telegramBotToken);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TelegramApiError && error.errorCode < 500) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Telegram отверг удаление webhook',
          details: error.description,
          code: error.errorCode,
        },
        { status: 400 },
      );
    }

    console.error('[settings/telegram/webhook DELETE]', error);
    return NextResponse.json(
      { ok: false, error: 'Не удалось удалить webhook' },
      { status: 502 },
    );
  }
}