import { prisma } from '@/lib/prisma';
import type { Settings } from '@prisma/client';

let cache: Settings | null = null;

export async function getSettings(): Promise<Settings | null> {
  if (cache) return cache;
  cache = await prisma.settings.findFirst({ orderBy: { createdAt: 'asc' } });
  return cache;
}

export function invalidateSettings(): void {
  cache = null;
}

export type SettingsUpdate = Partial<
  Omit<Settings, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>
>;


export async function updateSettings(
  data: SettingsUpdate,
): Promise<Settings> {
  const current = await prisma.settings.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  const organizationId =
    current?.organizationId ??
    (
      await prisma.organization.findFirstOrThrow({
        orderBy: { createdAt: 'asc' },
      })
    ).id;

  const updated = await prisma.settings.upsert({
    where: { organizationId },
    create: { organizationId, ...data },
    update: data,
  });

  invalidateSettings();
  return updated;
}