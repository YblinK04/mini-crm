
import { NextResponse } from 'next/server';
import { getAdapter } from '@/lib/channels/registry';
import { handleIncomingMessage } from '@/lib/channels/handler';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ channel: string }> },
): Promise<Response> {
  const { channel } = await params;

 
  let incoming;
  try {
    const adapter = getAdapter(channel);
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: true });
    }

    incoming = await adapter.parseWebhook(body, request.headers);
  } catch (error) {
    console.error('[webhook] parse/verify failed:', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  if (!incoming) {
    return NextResponse.json({ ok: true });
  }

  try {
    await handleIncomingMessage(incoming);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[webhook] handler failed:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}