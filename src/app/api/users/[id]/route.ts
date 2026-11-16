import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireOwner } from '@/lib/auth-helpers';

const UpdateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
  role: z.enum(['MANAGER', 'ADMIN']).optional(),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[a-zA-Z]/)
    .regex(/\d/)
    .optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  const denied = requireOwner(session);
  if (denied) return denied;

  const { id } = await params;

  if (id === session!.user.id) {
    return NextResponse.json(
      { error: 'Нельзя изменить свою роль или деактивировать себя' },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Некорректные данные', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const target = await prisma.user.findFirst({
    where: { id, organizationId: session!.user.organizationId },
    select: { id: true, role: true },
  });
  if (!target) {
    return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
  }

  if (target.role === 'OWNER') {
    return NextResponse.json(
      { error: 'Нельзя изменить владельца организации' },
      { status: 403 },
    );
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.password !== undefined) {
    data.password = await hash(parsed.data.password, 10);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: 'Нет полей для обновления' },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}