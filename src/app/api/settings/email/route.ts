import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSettings, invalidateSettings } from '@/lib/settings';
import {
  EmailTestActionSchema,
  UpdateEmailSettingsSchema,
} from '@/lib/schemas';
import { testSmtpConnection, sendEmail } from '@/services/email.service';

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await getSettings();

  return NextResponse.json({
    smtpHost: settings?.smtpHost ?? '',
    smtpPort: settings?.smtpPort ?? 465,
    smtpSecure: settings?.smtpSecure ?? true,
    smtpUser: settings?.smtpUser ?? '',
    smtpFrom: settings?.smtpFrom ?? '',
    hasSmtpPassword: Boolean(settings?.smtpPassword),
    emailNotificationsEnabled: settings?.emailNotificationsEnabled ?? false,
    notifyOnNewLead: settings?.notifyOnNewLead ?? true,
    notifyDailyDigest: settings?.notifyDailyDigest ?? true,
    ownerEmail: settings?.ownerEmail ?? '',
    smtpLastTestedAt: settings?.smtpLastTestedAt ?? null,
    smtpLastTestOk: settings?.smtpLastTestOk ?? null,
    smtpLastTestError: settings?.smtpLastTestError ?? null,
  });
}

export async function PATCH(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdateEmailSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const existing = await prisma.settings.findFirst({
    where: { organizationId: session.user.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue;

    if (key === 'smtpPassword') {
      if (value !== '') data.smtpPassword = value;
      continue;
    }

    data[key] = value === '' ? null : value;
  }

  const merged = { ...existing, ...data } as typeof existing;
  if (merged.emailNotificationsEnabled) {
    const missing: string[] = [];
    if (!merged.smtpHost) missing.push('SMTP-хост');
    if (!merged.smtpUser) missing.push('SMTP-логин');
    if (!merged.smtpPassword) missing.push('SMTP-пароль');
    if (!merged.ownerEmail) missing.push('Email получателя');
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Для включения уведомлений заполните: ${missing.join(', ')}`,
          missing,
        },
        { status: 422 },
      );
    }
  }

  await prisma.settings.update({
    where: { id: existing.id },
    data,
  });

  invalidateSettings();
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = EmailTestActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  const existing = await prisma.settings.findFirst({
    where: { organizationId: session.user.organizationId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
  }

  if (parsed.data.action === 'test-connection') {
    const result = await testSmtpConnection();

    await prisma.settings.update({
      where: { id: existing.id },
      data: {
        smtpLastTestedAt: new Date(),
        smtpLastTestOk: result.ok,
        smtpLastTestError: result.ok
          ? null
          : result.error?.slice(0, 500) ?? 'Unknown error',
      },
    });
    invalidateSettings();

    return NextResponse.json(result);
  }

  const settings = await getSettings();
  if (!settings?.ownerEmail) {
    return NextResponse.json(
      { ok: false, error: 'Укажите email владельца' },
      { status: 400 },
    );
  }

  const sent = await sendEmail({
    to: settings.ownerEmail,
    subject: '✅ Тестовое письмо из RealCRM',
    html: '<h2>Привет!</h2><p>Если вы читаете это письмо — SMTP настроен корректно.</p>',
  });

  return NextResponse.json({ ok: sent });
}