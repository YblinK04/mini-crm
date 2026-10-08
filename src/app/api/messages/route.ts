
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { messageService } from '@/services/message.service';

export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dealId = searchParams.get('dealId');

  if (!dealId) {
    return NextResponse.json(
      { error: 'Укажите dealId' },
      { status: 400 },
    );
  }

  try {
    const messages = await messageService.findByDeal({
      organizationId: session.user.organizationId,
      dealId,
    });
    return NextResponse.json(messages);
  } catch (error) {
    console.error('[messages GET]', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить сообщения' },
      { status: 500 },
    );
  }
}