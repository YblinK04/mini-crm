
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSettings, invalidateSettings } from '@/lib/settings';


function isOwnerOrAdmin(role: string | undefined): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}


export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isOwnerOrAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const settings = await getSettings();

  return NextResponse.json(
    {
      autoReplyEnabled: settings?.autoReplyEnabled ?? false,
      autoReplyText: settings?.autoReplyText ?? '',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}


const UpdateSchema = z
  .object({
    autoReplyEnabled: z.boolean(),
    autoReplyText: z.string().trim().max(4000).nullable(),
  })
  .refine(
    (data) =>
      !data.autoReplyEnabled ||
      (data.autoReplyText !== null && data.autoReplyText.length > 0),
    {
      message: 'Заполните текст автоответа, чтобы включить его',
      path: ['autoReplyText'],
    },
  );

export async function PATCH(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isOwnerOrAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { organizationId, id: userId } = session.user;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const existing = await prisma.settings.findUnique({
      where: { organizationId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 },
      );
    }

    const updated = await prisma.settings.update({
      where: { id: existing.id, organizationId }, 
      data: {
        autoReplyEnabled: parsed.data.autoReplyEnabled,
        autoReplyText: parsed.data.autoReplyText || null,
      },
    });

    invalidateSettings();

    prisma.auditLog
      .create({
        data: {
          organizationId,
          userId,
          action: 'AUTOMATION_SETTINGS_UPDATED',
          metadata: {
            autoReplyEnabled: parsed.data.autoReplyEnabled,
            autoReplyTextLength: parsed.data.autoReplyText?.length ?? 0,
          },
        },
      })
      .catch((e) => console.error('[AUTOMATION_AUDIT_FAILED]', e));

    return NextResponse.json(
      {
        ok: true,
        autoReplyEnabled: updated.autoReplyEnabled,
        autoReplyText: updated.autoReplyText,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error: unknown) {
    console.error('[AUTOMATION_SETTINGS_PATCH]', {
      organizationId,
      error,
    });
    return NextResponse.json(
      { error: 'Не удалось сохранить настройки' },
      { status: 500 },
    );
  }
}