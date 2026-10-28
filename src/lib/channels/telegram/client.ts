const API_BASE = 'https://telegram-proxy.yar-yazevv.workers.dev';
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

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: { url: string };
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface ReplyKeyboardMarkup {
  keyboard: { text: string }[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
}

export interface ReplyKeyboardRemove {
  remove_keyboard: true;
  selective?: boolean;
}

export interface ForceReply {
  force_reply: true;
  selective?: boolean;
}

export type ReplyMarkup =
  | InlineKeyboardMarkup
  | ReplyKeyboardMarkup
  | ReplyKeyboardRemove
  | ForceReply;


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
  const text = await res.text().catch(() => '');

  if (!res.ok) {
    throw new Error(
      `[telegram] ${method} HTTP ${res.status}: ${text.slice(0, 200)}`,
    );
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `[telegram] ${method} returned non-JSON response (proxy error?): ${text.slice(0, 200)}`,
    );
  }

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
  replyMarkup?: ReplyMarkup, 
): Promise<{ message_id: number }> {
  return callTelegram<{ message_id: number }>(botToken, 'sendMessage', {
    chat_id: chatId,
    text,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
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
    allowed_updates: ['message', 'callback_query'],
  });
}

export async function deleteWebhook(botToken: string): Promise<boolean> {
  return callTelegram<boolean>(botToken, 'deleteWebhook');
}

export async function answerCallbackQuery(
  botToken: string,
  callbackQueryId: string,
  text?: string,
): Promise<boolean> {
  return callTelegram<boolean>(botToken, 'answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  });
}