import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { dealService } from '@/services/deal.service';
import {
  CreateDealApiSchema,
  type CreateDealApiInput,
} from '@/lib/schemas';

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json(
        {
          error:
            'Пользователь не авторизован или отсутствует привязка к организации',
        },
        { status: 401 },
      );
    }

    const { id: userId, organizationId } = session.user;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Некорректный формат JSON или пустое тело запроса' },
        { status: 400 },
      );
    }

    const validatedFields = CreateDealApiSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Ошибка валидации полей CRM для создания сделки',
          details: validatedFields.error.flatten(),
        },
        { status: 422 },
      );
    }

    const validData: CreateDealApiInput = validatedFields.data;

    const newDeal = await dealService.create(
      {
        title: validData.title,
        budget: validData.budget,
        stageId: validData.stageId,
        pipelineId: validData.pipelineId,
        description: validData.description,
        priority: validData.priority,
        companyId: validData.companyId,
        contactIds: validData.contactIds,
        customFields: validData.customFields, // ← Record, без as any
      },
      organizationId,
      userId,
    );

    return NextResponse.json(newDeal, { status: 201 });
  } catch (error: unknown) {
    console.error(
      JSON.stringify({
        context: 'CRM_API_DEALS_POST_ERROR',
        message: 'Критический сбой при создании новой сделки в СУБД',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера при создании карточки сделки' },
      { status: 500 },
    );
  }
}