import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { sendEmail } from '@/services/email.service';

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const TARGET_HOUR = 9;

type TimerHandle = ReturnType<typeof setInterval> & { unref?: () => void };
const g = globalThis as typeof globalThis & {
  __emailDigestTimer?: TimerHandle;
  __emailDigestInFlight?: boolean;
};


function localDateKey(date: Date): string {
  return date.toLocaleDateString('sv-SE');
}

export async function runDailyDigestIfDue(): Promise<boolean> {
  const now = new Date();
  if (now.getHours() < TARGET_HOUR) return false;

  const settings = await getSettings();
  if (!settings) return false;
  if (!settings.emailNotificationsEnabled) return false;
  if (!settings.notifyDailyDigest) return false;
  if (!settings.ownerEmail) return false;

  const todayKey = localDateKey(now);
  if (
    settings.emailDigestLastSentAt &&
    localDateKey(settings.emailDigestLastSentAt) === todayKey
  ) {
    return false;
  }

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [tasksToday, tasksOverdue, inboxCount] = await Promise.all([
    prisma.task.count({
      where: {
        organizationId: settings.organizationId,
        completedAt: null,
        dueAt: { gte: startOfToday, lt: endOfToday },
      },
    }),
    prisma.task.count({
      where: {
        organizationId: settings.organizationId,
        completedAt: null,
        dueAt: { lt: startOfToday },
      },
    }),
    prisma.deal.count({
      where: {
        organizationId: settings.organizationId,
        archivedAt: null,
        pipeline: { isInbox: true },
      },
    }),
  ]);

  if (tasksToday === 0 && tasksOverdue === 0 && inboxCount === 0) {
    await prisma.settings.update({
      where: { organizationId: settings.organizationId },
      data: { emailDigestLastSentAt: new Date() },
    });
    return false;
  }

  const publicUrl = process.env.PUBLIC_URL;
  if (!publicUrl) {
    console.warn(
      '[email-daily-digest] PUBLIC_URL не задан — ссылка в письме будет нерабочей',
    );
  }
  const baseUrl = publicUrl || 'http://localhost:3000';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px;">
      <h2 style="margin: 0 0 16px; font-size: 20px;">☀️ Доброе утро!</h2>
      <p style="margin: 0 0 16px; color: #666;">Вот что вас ждёт сегодня:</p>
      <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
        ${tasksOverdue > 0 ? `
          <tr>
            <td style="padding: 8px 0;"><strong style="color: #ef4444;">⚠️ Просрочено:</strong></td>
            <td style="padding: 8px 0; text-align: right;"><strong>${tasksOverdue}</strong></td>
          </tr>
        ` : ''}
        ${tasksToday > 0 ? `
          <tr>
            <td style="padding: 8px 0;"><strong>📋 Задач на сегодня:</strong></td>
            <td style="padding: 8px 0; text-align: right;"><strong>${tasksToday}</strong></td>
          </tr>
        ` : ''}
        ${inboxCount > 0 ? `
          <tr>
            <td style="padding: 8px 0;"><strong>📥 Новых заявок:</strong></td>
            <td style="padding: 8px 0; text-align: right;"><strong>${inboxCount}</strong></td>
          </tr>
        ` : ''}
      </table>
      <p style="margin: 24px 0 0;">
        <a href="${baseUrl}/today" style="display: inline-block; background: #3b82f6; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Открыть Планер →
        </a>
      </p>
    </div>
  `;

  const sent = await sendEmail({
    to: settings.ownerEmail,
    subject: `☀️ Дайджест: ${tasksToday} задач, ${inboxCount} заявок`,
    html,
  });

  if (sent) {
    await prisma.settings.update({
      where: { organizationId: settings.organizationId },
      data: { emailDigestLastSentAt: new Date() },
    });
  }

  return sent;
}

export function registerEmailDailyDigest() {
  if (g.__emailDigestTimer) return;

  console.log('📧 [EMAIL] Утренний дайджест зарегистрирован');

  const timer = setInterval(async () => {
    if (g.__emailDigestInFlight) return;
    g.__emailDigestInFlight = true;
    try {
      await runDailyDigestIfDue();
    } catch (error) {
      console.error('[email-daily-digest] Ошибка:', error);
    } finally {
      g.__emailDigestInFlight = false;
    }
  }, CHECK_INTERVAL_MS) as TimerHandle;

  timer.unref?.();
  g.__emailDigestTimer = timer;
}