import { prisma } from '@/lib/prisma';
import { SEED_EXAMPLES } from './seeds';

export interface SeedResult {
  seeded: boolean;
  count: number;
  error?: string;
}

export async function seedDefaultExamples(
  organizationId: string,
  options: { force?: boolean } = {},
): Promise<SeedResult> {
  try {
    if (!options.force) {
      const count = await prisma.trainingExample.count({
        where: { organizationId },
      });
      if (count > 0) {
        return { seeded: false, count };
      }
    }

    console.log(
      `[SEED] Загрузка базовых примеров для организации ${organizationId}...`,
    );

    const result = await prisma.trainingExample.createMany({
      data: SEED_EXAMPLES.map((ex, i) => ({
        organizationId,
        text: ex.text,
        label: ex.label,
        createdById: null,
        isTest: i % 5 === 0,
      })),
      skipDuplicates: true,
    });

    console.log(`[SEED] Загружено ${result.count} примеров.`);

    return { seeded: true, count: result.count };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[SEED_ERROR] organizationId=${organizationId}`, error);
    return { seeded: false, count: 0, error: message };
  }
}