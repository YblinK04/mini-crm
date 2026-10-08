
import type { ChannelName } from '@/lib/channels/types';

export interface MessageJSON {
  id: string;
  direction: 'IN' | 'OUT';
  channel: ChannelName;
  content: string;
  createdAt: string;
}

const FETCH_TIMEOUT_MS = 15_000;

async function parseError(res: Response): Promise<string> {
  const raw: unknown = await res.json().catch(() => null);
  if (
    raw !== null &&
    typeof raw === 'object' &&
    'error' in raw &&
    typeof (raw as { error: unknown }).error === 'string'
  ) {
    return (raw as { error: string }).error;
  }
  return `Ошибка ${res.status}`;
}

function assertMessageArray(raw: unknown): asserts raw is MessageJSON[] {
  if (!Array.isArray(raw)) {
    throw new Error('Некорректный ответ сервера');
  }
  for (const item of raw) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof (item as { id?: unknown }).id !== 'string'
    ) {
      throw new Error('Некорректный ответ сервера');
    }
  }
}

export async function fetchDealMessages(
  dealId: string,
): Promise<MessageJSON[]> {
  const res = await fetch(
    `/api/messages?dealId=${encodeURIComponent(dealId)}`,
    { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
  );
  if (!res.ok) throw new Error(await parseError(res));
  const raw: unknown = await res.json();
  assertMessageArray(raw);
  return raw;
}

export async function sendDealMessage(
  dealId: string,
  text: string,
): Promise<MessageJSON> {
  const res = await fetch('/api/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dealId, text }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}