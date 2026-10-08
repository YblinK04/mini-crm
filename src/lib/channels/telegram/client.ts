

const API_BASE = 'https://api.telegram.org';
const REQUEST_TIMEOUT_MS = 15_000;

export class TelegramApiError extends Error {
  constructor(
    readonly method: string,
    readonly errorCode: number,
    readonly description: string,
    readonly parameters?: { retry_after?: number; migrate_to_chat_id?: number },
  ) {
    super(`[telegram] ${method} failed: ${description} (${errorCode})`);
    this.name = 'TelegramApiError';
  }
}

async function callTelegram<T>(
  botToken: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const url = `${API_BASE}/bot${botToken}/${method}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `[telegram] ${method} HTTP ${res.status}: ${text.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as
    | { ok: true; result: T }
    | {
        ok: false;
        description: string;
        error_code: number;
        parameters?: { retry_after?: number; migrate_to_chat_id?: number };
      };

  if (!data.ok) {
    throw new TelegramApiError(
      method,
      data.error_code,
      data.description,
      data.parameters,
    );
  }

  return data.result;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export async function getMe(botToken: string): Promise<TelegramUser> {
  return callTelegram<TelegramUser>(botToken, 'getMe');
}

export async function sendMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<{ message_id: number }> {
  return callTelegram<{ message_id: number }>(botToken, 'sendMessage', {
    chat_id: chatId,
    text,
  });
}

export async function setWebhook(
  botToken: string,
  url: string,
  secretToken: string,
): Promise<boolean> {
  return callTelegram<boolean>(botToken, 'setWebhook', {
    url,
    secret_token: secretToken,
    allowed_updates: ['message'], // пока только обычные сообщения
  });
}

export async function deleteWebhook(botToken: string): Promise<boolean> {
  return callTelegram<boolean>(botToken, 'deleteWebhook');
}