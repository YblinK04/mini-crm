// src/app/api/register/route.ts
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { CreatedUserSchema } from "@/lib/schemas";
import { hash } from "bcryptjs";
import { ZodError } from "zod";

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ error: "Пустое тело запроса или невалидный JSON" }, { status: 400 });
    }

    const validated = CreatedUserSchema.parse(body);

    const exists = await prisma.user.findUnique({ 
      where: { email: validated.email } 
    });
    
    if (exists) {
      return NextResponse.json({ error: "Пользователь с такой почтой уже зарегистрирован" }, { status: 400 });
    }

    const hashedPassword = await hash(validated.password, 12);
    
    const organization = await prisma.organization.create({
      data: {
        name: `Компания ${validated.name}`,
      }
    });

    const user = await prisma.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        password: hashedPassword,
        role: "ADMIN", 
        organizationId: organization.id, 
      },
    });

    const pipeline = await prisma.pipeline.create({
      data: {
        name: "Main Pipeline",
        organizationId: organization.id,
      }
    });

    await prisma.stage.createMany({
      data: [
        { name: "Новые лиды", color: "#3b82f6", order: 0, pipelineId: pipeline.id },
        { name: "В работе", color: "#f59e0b", order: 1, pipelineId: pipeline.id },
        { name: "Согласование договора", color: "#8b5cf6", order: 2, pipelineId: pipeline.id },
        { name: "Успешно реализовано", color: "#10b981", order: 3, pipelineId: pipeline.id },
        { name: "Закрыто и утеряно", color: "#ef4444", order: 4, pipelineId: pipeline.id },
      ]
    });

    return NextResponse.json({ success: true, id: user.id }, { status: 201 });

  } catch (error: unknown) {
    console.error("❌ [CRM_REGISTRATION_CRITICAL_FAILED] Системный сбой при регистрации аккаунта:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: "Ошибка валидации данных", 
          details: error.flatten().fieldErrors 
        }, 
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при создании личного кабинета CRM" }, 
      { status: 500 }
    );
  }
}
