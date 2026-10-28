
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes, randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { rateLimiter } from '@/lib/rate-limiter';
import { events } from '@/lib/events';

const LeadSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Некорректный slug'),
  name: z.string().trim().min(1, 'Имя обязательно').max(100),
  message: z.string().trim().min(1, 'Сообщение обязательно').max(4000),
});

export async function POST(request: Request): Promise<Response> {
 
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const rateStatus = rateLimiter.check(`public-lead:${ip}`, 3, 60_000);
  if (rateStatus.limited) {
    return NextResponse.json(
      { error: 'Слишком много заявок. Попробуйте позже.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateStatus.retryAfterSec) },
      },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { slug, name, message } = parsed.data;

  try {
    const org = await prisma.organization.findUnique({
      where: { publicSlug: slug },
      select: { id: true, isActive: true },
    });

    if (!org || !org.isActive) {
      return NextResponse.json(
        { error: 'Организация недоступна' },
        { status: 404 },
      );
    }

    const defaultStage = await prisma.stage.findFirst({
      where: { pipeline: { organizationId: org.id } },
      orderBy: [{ pipeline: { createdAt: 'asc' } }, { order: 'asc' }],
      select: { id: true, pipelineId: true },
    });

    if (!defaultStage) {
      return NextResponse.json(
        { error: 'Воронки не настроены' },
        { status: 400 },
      );
    }

    const publicToken = randomBytes(32).toString('base64url');
    const result = await prisma.$transaction(async (tx) => {
      const contact = await tx.contact.create({
        data: {
          organizationId: org.id,
          firstName: name,
          
          telegramUsername: `web:${publicToken}`,
        },
      });

      const deal = await tx.deal.create({
        data: {
          organizationId: org.id,
          pipelineId: defaultStage.pipelineId,
          stageId: defaultStage.id,
          title: `Заявка с сайта: ${name}`,
          budget: 0,
          priority: 'MEDIUM',
          publicToken,
          contacts: { connect: { id: contact.id } },
        },
      });

      const firstMessage = await tx.message.create({
        data: {
          organizationId: org.id,
          contactId: contact.id,
          dealId: deal.id,
          channel: 'WEB',
          direction: 'IN',
          externalChatId: publicToken,
          externalMessageId: randomUUID(),
          content: message,
          rawPayload: {
            ip,
            userAgent: request.headers.get('user-agent') ?? null,
          },
        },
      });

      return { deal, contact, firstMessage };
    });
    void events
      .emit('message.received', {
        message: result.firstMessage,
        contact: result.contact,
        dealId: result.deal.id,
        organizationId: org.id,
      })
      .catch((e) => console.error('[PUBLIC_LEAD] emit failed:', e));

    return NextResponse.json(
      { ok: true, token: result.deal.publicToken },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      },
    );
  } catch (error: unknown) {
    console.error('[PUBLIC_LEAD_ERROR]', { slug, ip, error });
    return NextResponse.json(
      { error: 'Не удалось создать заявку' },
      { status: 500 },
    );
  }
}