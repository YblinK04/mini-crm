export interface SettingsStatus {
  telegramBotUsername: string | null;
  hasTelegramToken: boolean;
  hasTelegramSecret: boolean;
  publicUrl: string | null;
}

export interface TestResult {
  ok: true;
  bot: { id: number; username: string | null; firstName: string };
}

export interface WebhookResult {
  ok: true;
  url: string;
}


export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const raw: unknown = await res.json().catch(() => ({}));
  const body =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  if (!res.ok) {
    throw new ApiError(
      typeof body.error === 'string' ? body.error : `HTTP ${res.status}`,
      res.status,
      typeof body.details === 'string' ? body.details : undefined,
    );
  }
  return body as T;
}

export const QUERY_KEY = ['settings', 'telegram'] as const;

export function fetchStatus(): Promise<SettingsStatus> {
  return api<SettingsStatus>('/api/settings/telegram');
}

export function saveCredentials(data: {
  telegramBotToken?: string;
  telegramWebhookSecret?: string;
}): Promise<SettingsStatus> {
  return api<SettingsStatus>('/api/settings/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function testBot(): Promise<TestResult> {
  return api<TestResult>('/api/settings/telegram/test', { method: 'POST' });
}

export function setWebhook(baseUrl: string): Promise<WebhookResult> {
  return api<WebhookResult>('/api/settings/telegram/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseUrl }),
  });
}

export function deleteWebhook(): Promise<{ ok: true }> {
  return api<{ ok: true }>('/api/settings/telegram/webhook', {
    method: 'DELETE',
  });
}