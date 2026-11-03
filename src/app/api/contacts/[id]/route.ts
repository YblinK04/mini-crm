import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isPrismaNotFound } from '@/lib/errors';

const IdSchema = z.string().cuid();

const UpdateContactSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Имя обязательно').max(50).optional(),
    lastName: z.string().trim().max(50).optional().nullable(),
    phone: z.string().trim().max(50).optional().nullable(),
    email: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
      z.string().trim().email('Некорректный email').max(255).nullable().optional(),
    ),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'Хотя бы одно поле должно быть передано',
  });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;

  const { id } = await params;
  const idParsed = IdSchema.safeParse(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Invalid contact id' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdateContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const data = {
    ...(parsed.data.firstName !== undefined && { firstName: parsed.data.firstName }),
    ...(parsed.data.lastName !== undefined && {
      lastName: parsed.data.lastName || null,
    }),
    ...(parsed.data.phone !== undefined && { phone: parsed.data.phone || null }),
    ...(parsed.data.email !== undefined && { email: parsed.data.email || null }),
  };

  try {
    const contact = await prisma.contact.update({
      where: { id, organizationId },
      data,
    });

    return NextResponse.json(contact, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error: unknown) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json(
        { error: 'Контакт не найден' },
        { status: 404 },
      );
    }

    console.error('[CONTACT_PATCH]', {
      contactId: id,
      organizationId,
      error,
    });

    return NextResponse.json(
      { error: 'Не удалось обновить контакт' },
      { status: 500 },
    );
  }
}