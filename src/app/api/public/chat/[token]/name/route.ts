import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimiter } from '@/lib/rate-limiter';

const ProfileSchema = z.object({
  name: z.string().trim().min(2, 'Имя слишком короткое').max(50),
  phone: z.string().trim().max(50).optional().nullable(),
  email: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().email('Некорректный email').max(255).nullable().optional(),
  ),
  consent: z
    .boolean()
    .refine((v) => v === true, {
      message: 'Необходимо согласие на обработку данных',
    }),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const rateStatus = rateLimiter.check(`public-profile:${ip}`, 5, 60_000);
  if (rateStatus.limited) {
    return NextResponse.json(
      { error: 'Слишком много запросов. Попробуйте позже.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateStatus.retryAfterSec) },
      },
    );
  }

  const { token } = await params;
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const deal = await prisma.deal.findUnique({
      where: { publicToken: token },
      select: {
        id: true,
        publicTokenExpiresAt: true,
        organization: { select: { id: true, isActive: true } },
        contacts: {
          where: { telegramUsername: `web:${token}` },
          take: 1,
          select: { id: true },
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Чат не найден' }, { status: 404 });
    }

    if (!deal.organization.isActive) {
      return NextResponse.json(
        { error: 'Организация недоступна' },
        { status: 403 },
      );
    }

    if (deal.publicTokenExpiresAt && deal.publicTokenExpiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Срок действия ссылки истёк' },
        { status: 410 },
      );
    }

    const existingContact = deal.contacts[0];
    const username = `web:${token}`;

    const contactData = {
      firstName: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
    
    };

    if (existingContact) {
      await prisma.contact.update({
        where: {
          id: existingContact.id,
          organizationId: deal.organization.id,
        },
        data: contactData,
      });
    } else {
      await prisma.$transaction(async (tx) => {
        let contact = await tx.contact.findFirst({
          where: {
            organizationId: deal.organization.id,
            telegramUsername: username,
          },
          select: { id: true },
        });

        if (!contact) {
          contact = await tx.contact.create({
            data: {
              organizationId: deal.organization.id,
              telegramUsername: username,
              ...contactData,
            },
            select: { id: true },
          });

          await tx.deal.update({
            where: {
              id: deal.id,
              organizationId: deal.organization.id,
            },
            data: { contacts: { connect: { id: contact.id } } },
          });
        } else {
          await tx.contact.update({
            where: {
              id: contact.id,
              organizationId: deal.organization.id,
            },
            data: contactData,
          });
        }
      });
    }

    return NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error: unknown) {
    console.error('[PUBLIC_CHAT_PROFILE_POST]', {
      tokenPreview: token.slice(0, 8) + '...',
      ip,
      error,
    });
    return NextResponse.json(
      { error: 'Не удалось сохранить профиль' },
      { status: 500 },
    );
  }
}