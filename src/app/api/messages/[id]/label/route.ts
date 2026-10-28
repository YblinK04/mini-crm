import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TrainingLabel } from '@prisma/client';
import { invalidateClassifier } from '@/lib/channels/handler';

const LabelSchema = z.object({
  label: z.nativeEnum(TrainingLabel),
});

const IdSchema = z.string().cuid();

export async function POST(
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
    return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = LabelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid label', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const message = await prisma.message.findFirst({
      where: {
        id,
        organizationId,
        direction: 'IN',
      },
      select: { content: true },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 },
      );
    }

    const example = await prisma.trainingExample.upsert({
      where: {
        organizationId_text: {
          organizationId,
          text: message.content,
        },
      },
      create: {
        organizationId,
        text: message.content,
        label: parsed.data.label,
        sourceMessageId: id,
        createdById: session.user.id,
      },
      update: {
        label: parsed.data.label,
        createdById: session.user.id,
      },
    });

    invalidateClassifier(organizationId);

    return NextResponse.json(
      { ok: true, exampleId: example.id },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error: unknown) {
    console.error('[LABEL_MESSAGE_ERROR]', {
      messageId: id,
      organizationId,
      label: parsed.data.label,
      error,
    });
    return NextResponse.json(
      { error: 'Failed to label message' },
      { status: 500 },
    );
  }
}