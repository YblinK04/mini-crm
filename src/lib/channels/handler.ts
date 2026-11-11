import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { contactService } from '@/services/contact.service';
import { messageService } from '@/services/message.service';
import { events } from '@/lib/events';
import { rateLimiter } from '@/lib/rate-limiter';
import { NaiveBayesClassifier } from '@/lib/classifier';
import { seedDefaultExamples } from '@/lib/classifier/seed-runner';
import { getAdapter } from './registry';
import { getOrCreateInboxPipeline } from '@/lib/inbox-pipeline';
import type { IncomingMessage } from './types';

interface CachedClassifier {
  classifier: NaiveBayesClassifier;
  loadedAt: number;
  examplesCount: number;
}

const CLASSIFIER_TTL_MS = 60 * 60 * 1000;
const classifierCache = new Map<string, CachedClassifier>();

export function invalidateClassifier(organizationId: string): void {
  classifierCache.delete(organizationId);
}

async function getClassifier(
  organizationId: string,
): Promise<NaiveBayesClassifier> {
  const cached = classifierCache.get(organizationId);
  const now = Date.now();

  if (cached && now - cached.loadedAt < CLASSIFIER_TTL_MS) {
    return cached.classifier;
  }

  const examples = await prisma.trainingExample.findMany({
    where: { organizationId },
    select: { text: true, label: true },
  });

  const classifier = new NaiveBayesClassifier();
  classifier.train(examples);

  classifierCache.set(organizationId, {
    classifier,
    loadedAt: now,
    examplesCount: examples.length,
  });

  return classifier;
}

export async function handleIncomingMessage(msg: IncomingMessage): Promise<void> {
  const settings = await getSettings();
  if (!settings) {
    console.warn('[handler] Settings not configured, skipping message');
    return;
  }

  const { organizationId } = settings;

  if (msg.callbackQueryId) {
    if (settings.telegramBotToken && msg.channel === 'TELEGRAM') {
      try {
        const tg = await import('./telegram/client');
        await tg.answerCallbackQuery(
          settings.telegramBotToken,
          msg.callbackQueryId,
        );
      } catch (e) {
        console.error('[handler] answerCallbackQuery failed:', e);
      }
    }
    console.log(`[callback] ${msg.callbackData} от ${msg.externalChatId}`);
    return;
  }

  const rateLimitKey = `${msg.channel}:${msg.externalChatId}`;
  const rateStatus = rateLimiter.check(rateLimitKey, 15, 60_000);
  if (rateStatus.limited) {
    console.warn(
      `[rate-limit] Флуд от ${rateLimitKey}, retry after ${rateStatus.retryAfterSec}s`,
    );
    return;
  }

  const examplesCount = await prisma.trainingExample.count({
    where: { organizationId },
  });
  if (examplesCount === 0) {
    void seedDefaultExamples(organizationId).catch((e) =>
      console.error('[handler] seed failed:', e),
    );
  }

  const classifier = await getClassifier(organizationId);
  const prediction = classifier.predict(msg.text);

  if (prediction.confidence >= 0.3) {
    console.log(
      `[bayes] "${msg.text.slice(0, 50)}..." -> ${prediction.label} (${(prediction.confidence * 100).toFixed(0)}%)`,
    );
  }

  if (prediction.label === 'SPAM' && prediction.confidence > 0.6) {
    console.log(`[bayes] Спам отсечён: ${msg.externalChatId}`);
    return;
  }

  const contact = await contactService.findOrCreateByExternalId({
    organizationId,
    channel: msg.channel,
    externalId: msg.externalChatId,
    displayName: msg.displayName,
    username: msg.username,
  });

  const dealId = await findOrCreateDealForContact(
    organizationId,
    contact.id,
    contact.firstName,
  );

  const { message, created } = await messageService.save({
    organizationId,
    contactId: contact.id,
    dealId,
    channel: msg.channel,
    direction: 'IN',
    externalChatId: msg.externalChatId,
    externalMessageId: msg.externalMessageId,
    content: msg.text,
    rawPayload: msg.rawPayload,
  });

  if (!created) return;

  if (dealId && settings.telegramBotToken && msg.channel === 'TELEGRAM') {
    void sendWelcomeButton({
      botToken: settings.telegramBotToken,
      chatId: msg.externalChatId,
      dealId,
    }).catch((e) => console.error('[handler] welcome button failed:', e));
  }

  await events.emit('message.received', {
    message,
    contact,
    dealId,
    organizationId,
  });
}

async function sendWelcomeButton(params: {
  botToken: string;
  chatId: string;
  dealId: string;
}): Promise<void> {
  const { botToken, chatId, dealId } = params;
  const publicUrl = process.env.PUBLIC_URL;

  if (!publicUrl) {
    console.warn('[handler] PUBLIC_URL не задан, кнопка не отправлена');
    return;
  }

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { publicToken: true },
  });

  if (deal?.publicToken) return;

  const publicToken = randomBytes(32).toString('base64url');

  const claimed = await prisma.deal.updateMany({
    where: { id: dealId, publicToken: null },
    data: { publicToken },
  });

  if (claimed.count === 0) return;

  const webUrl = `${publicUrl.replace(/\/+$/, '')}/chat/${publicToken}`;

  const adapter = getAdapter('TELEGRAM');
  await adapter.sendMessage(
    chatId,
    'Здравствуйте! Мы получили вашу заявку. Нажмите кнопку ниже, чтобы открыть чат с менеджером.',
    {
      replyMarkup: {
        inline_keyboard: [[{ text: '💬 Открыть чат', url: webUrl }]],
      },
    },
  );
}


const DEAL_LOCK = new Map<string, Promise<string | null>>();

async function findOrCreateDealForContactInner(
  organizationId: string,
  contactId: string,
  contactName: string,
): Promise<string | null> {
  const existing = await prisma.deal.findFirst({
    where: {
      organizationId,
      contacts: { some: { id: contactId } },
    },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });

  if (existing) return existing.id;

  const inbox = await getOrCreateInboxPipeline(organizationId);
  const firstStage = inbox.stages[0];

  if (!firstStage) {
    console.warn(
      `[handler] Нет этапов в "Входящих" для организации ${organizationId}`,
    );
    return null;
  }

  const title =
    contactName && contactName !== 'Без имени'
      ? `Заявка: ${contactName}`
      : 'Новая заявка из чата';

  const newDeal = await prisma.deal.create({
    data: {
      organizationId,
      pipelineId: inbox.id,
      stageId: firstStage.id,
      title,
      contacts: { connect: { id: contactId } },
      budget: 0,
      priority: 'MEDIUM',
    },
    select: { id: true },
  });

  console.log(`📥 [INBOX] Новая сделка ${newDeal.id} создана в "Входящих"`);
  return newDeal.id;
}

async function findOrCreateDealForContact(
  organizationId: string,
  contactId: string,
  contactName: string,
): Promise<string | null> {
  const lockKey = `${organizationId}:${contactId}`;
  const inflight = DEAL_LOCK.get(lockKey);
  if (inflight) return inflight;

  const promise = findOrCreateDealForContactInner(
    organizationId,
    contactId,
    contactName,
  ).finally(() => {
    DEAL_LOCK.delete(lockKey);
  });

  DEAL_LOCK.set(lockKey, promise);
  return promise;
}