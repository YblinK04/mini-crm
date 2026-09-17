import { PrismaClient, AuditLog, Prisma } from '@prisma/client';
import { prisma as globalPrisma } from '@/lib/prisma';
import { headers } from 'next/headers';

type JsonValue = Prisma.JsonValue;
type JsonObject = Prisma.JsonObject;

const SENSITIVE_KEYS = new Set([
  'password',
  'confirmpassword',
  'token',
  'secret',
  'oldpassword',
  'newpassword',
  'key',
]);


function scrubSensitiveData(value: JsonObject): JsonObject;
function scrubSensitiveData(value: JsonValue): JsonValue;
function scrubSensitiveData(value: JsonValue | undefined): JsonValue | undefined;
function scrubSensitiveData(value: JsonValue | undefined): JsonValue | undefined {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubSensitiveData(item));
  }

  const cleaned: JsonObject = {};
  for (const [key, val] of Object.entries(value)) {
    cleaned[key] = SENSITIVE_KEYS.has(key.toLowerCase())
      ? '[REDACTED_SENSITIVE_DATA]'
      : scrubSensitiveData(val);
  }
  return cleaned;
}
export class AuditService {
  private prisma: PrismaClient;

  constructor(prismaInstance: PrismaClient = globalPrisma) {
    this.prisma = prismaInstance;
  }

  private async getRequestMetadata(): Promise<{
    ipAddress: string;
    userAgent: string;
  }> {
    try {
      const reqHeaders = await headers();

      const ipAddress =
        reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        reqHeaders.get('x-real-ip') ||
        'unknown';

      const userAgent = reqHeaders.get('user-agent') || 'unknown';

      return { ipAddress, userAgent };
    } catch {
      return {
        ipAddress: 'detached-context',
        userAgent: 'internal-background-task',
      };
    }
  }

  async log({
    organizationId,
    authorId,
    action,
    metadata,
  }: {
    organizationId: string;
    authorId: string;
    action: string;
    metadata?: JsonObject;
  }): Promise<AuditLog | null> {
    try {
      const { ipAddress, userAgent } = await this.getRequestMetadata();

      // При наличии metadata — чистим чувствительные ключи.
      // Перегрузка гарантирует JsonObject на выходе.
      const cleanMetadata = metadata
        ? scrubSensitiveData(metadata)
        : undefined;

      return await this.prisma.auditLog.create({
        data: {
          organizationId,
          userId: authorId,
          action,
          ipAddress,
          userAgent,
          metadata: cleanMetadata ?? Prisma.DbNull,
        },
      });
    } catch (error) {
      console.error(
        `❌ [CRM_AUDIT_LOG_CRITICAL_FAILED] Действие: ${action}. Ошибка:`,
        error,
      );
      return null;
    }
  }

  async enforceOwner(
    user: { id: string; role: string; organizationId: string },
    actionContext: string,
  ): Promise<boolean> {
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      console.warn(
        `🚨 [SECURITY_BREACH_ATTEMPT] Пользователь ${user.id} (${user.role}) попытался выполнить действие уровня OWNER в контексте: ${actionContext}`,
      );

      await this.log({
        organizationId: user.organizationId,
        authorId: user.id,
        action: `SECURITY_VIOLATION_${actionContext.toUpperCase()}`,
        metadata: {
          severity: 'CRITICAL',
          message:
            'Пользователь без прав Владельца или Администратора попытался выполнить защищенную операцию.',
          attemptedRole: user.role,
        },
      });

      throw new Error(
        'Доступ запрещен. Выполнение этой операции разрешено только Администратору воронки.',
      );
    }

    return true;
  }
}

export const auditService = new AuditService();