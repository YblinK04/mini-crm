import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';
import {
  getSettings,
  updateSettings,
  type SettingsUpdate,
} from '@/lib/settings';
import * as tg from '@/lib/channels/telegram/client';



function isAdminSession(session: Session | null): boolean {
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === 'ADMIN' || role === 'OWNER';
}

function responseShape(settings: {
  telegramBotUsername?: string | null;
  telegramBotToken?: string | null;
  telegramWebhookSecret?: string | null;
}) {
  return {
    telegramBotUsername: settings.telegramBotUsername ?? null,
    hasTelegramToken: Boolean(settings.telegramBotToken),
    hasTelegramSecret: Boolean(settings.telegramWebhookSecret),
    publicUrl: process.env.PUBLIC_URL?.replace(/\/+$/, '') ?? null,
  };
}


export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const settings = await getSettings();

  return NextResponse.json(responseShape(settings ?? {}));
}


const SaveSchema = z
  .object({
    telegramBotToken: z.string().trim().min(1).max(200).optional(),
    telegramWebhookSecret: z
      .string()
      .trim()
      .min(16)
      .max(256)
      .regex(/^[A-Za-z0-9_-]+$/, 'Only A-Za-z0-9_- are allowed')
      .optional(),
  })
  .refine(
    (d) =>
      d.telegramBotToken !== undefined ||
      d.telegramWebhookSecret !== undefined,
    { message: 'At least one field is required' },
  );

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const patch = parsed.data;
  const touchesWebhook = Boolean(
    patch.telegramBotToken || patch.telegramWebhookSecret,
  );

  const publicUrl = process.env.PUBLIC_URL?.replace(/\/+$/, '');
  if (touchesWebhook && !publicUrl) {
    return NextResponse.json(
      {
        error:
          'PUBLIC_URL is not configured on the server; cannot register webhook',
      },
      { status: 500 },
    );
  }

  let botUsername: string | undefined;
  if (patch.telegramBotToken) {
    try {
      const me = await tg.getMe(patch.telegramBotToken);
      botUsername = me.username;
    } catch (e) {
      return NextResponse.json(
        {
          error: 'Invalid bot token',
          details: e instanceof Error ? e.message : String(e),
        },
        { status: 400 },
      );
    }
  }

  const updatePayload: SettingsUpdate = { ...patch };
  if (botUsername) updatePayload.telegramBotUsername = botUsername;

  const updated = await updateSettings(updatePayload);

  if (touchesWebhook && updated.telegramBotToken && updated.telegramWebhookSecret) {
    try {
      await tg.setWebhook(
        updated.telegramBotToken,
        `${publicUrl}/api/webhooks/telegram`,
        updated.telegramWebhookSecret,
      );
    } catch (e) {
      console.error(
        '[settings/telegram] setWebhook failed, Telegram will reject incoming webhooks:',
        e,
      );
      return NextResponse.json(
        {
          ...responseShape(updated),
          error:
            'Settings saved, but webhook registration failed. Retry the request.',
          details: e instanceof Error ? e.message : String(e),
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(responseShape(updated));
}