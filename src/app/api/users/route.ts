import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireOwner } from '@/lib/auth-helpers';

const CreateUserSchema = z.object({
  email: z.string().trim().toLowerCase().email('Введите корректный email').max(255),
  name: z.string().trim().min(2, 'Имя слишком короткое').max(100),
  password: z
    .string()
    .min(8, 'Пароль должен быть не менее 8 символов')
    .max(72, 'Пароль слишком длинный')
    .regex(/[a-zA-Z]/, 'Пароль должен содержать латинские буквы')
    .regex(/\d/, 'Пароль должен содержать хотя бы одну цифру'),
  role: z.enum(['MANAGER', 'ADMIN']),
});

export async function GET(): Promise<Response> {
  const session = await auth();
  const denied = requireOwner(session);
  if (denied) return denied;

  const users = await prisma.user.findMany({
    where: { organizationId: session!.user.organizationId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  const denied = requireOwner(session);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = CreateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Некорректные данные', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { email, name, password, role } = parsed.data;
  const organizationId = session!.user.organizationId;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Пользователь с таким email уже существует' },
      { status: 409 },
    );
  }

  const hashedPassword = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role,
      organizationId,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}