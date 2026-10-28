import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slugify';

const PatchSchema = z.object({
  slug: z
    .string()
    .min(3, 'Минимум 3 символа')
    .max(32, 'Максимум 32 символа')
    .regex(/^[a-z0-9-]+$/, 'Только латиница, цифры и дефис'),
});

function isUniqueViolation(e: unknown): boolean {
  return typeof e === 'object' && e !== null && 'code' in e && (e as { code: unknown }).code === 'P2002';
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { name: true, publicSlug: true },
    });

    if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const baseSlug = slugify(org.name) || 'crm';
    const suggestedSlug = org.publicSlug ? null : `${baseSlug}-${randomUUID().slice(0, 4)}`;

    return NextResponse.json(
      { slug: org.publicSlug, suggestedSlug },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[PUBLIC_LINK_GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { slug } = parsed.data;
  const { organizationId, id: userId } = session.user;

  try {
    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: { publicSlug: slug },
      select: { publicSlug: true },
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'PUBLIC_SLUG_UPDATED',
        metadata: { slug },
      },
    }).catch((e) => console.error('Audit failed', e));

    return NextResponse.json(
      { slug: updated.publicSlug },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: unknown) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: 'Этот адрес уже занят. Попробуйте другой.' },
        { status: 400 }
      );
    }
    console.error('[PUBLIC_LINK_PATCH]', { organizationId, error });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { name: true, publicSlug: true },
    });

    if (org?.publicSlug) {
      return NextResponse.json({ slug: org.publicSlug });
    }

    const baseSlug = slugify(org?.name || 'crm');
    
    for (let i = 0; i < 5; i++) {
      const newSlug = `${baseSlug}-${randomUUID().slice(0, 4)}`;
      try {
        const result = await prisma.organization.updateMany({
          where: { id: session.user.organizationId, publicSlug: null },
          data: { publicSlug: newSlug },
        });
        if (result.count > 0) return NextResponse.json({ slug: newSlug });
        break; 
      } catch (e) {
        if (!isUniqueViolation(e)) throw e;
      }
    }
    
    const fresh = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { publicSlug: true },
    });
    return NextResponse.json({ slug: fresh?.publicSlug });

  } catch (error) {
    console.error('[PUBLIC_LINK_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}