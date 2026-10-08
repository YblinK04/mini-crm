
import { PrismaClient, Message, Prisma } from '@prisma/client';
import { prisma as globalPrisma } from '@/lib/prisma';
import type { ChannelName } from '@/lib/channels/types';

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(limit), MAX_LIMIT);
}

export type SaveMessageResult = {
  message: Message;
  created: boolean;
};

export class MessageService {
  constructor(private prisma: PrismaClient = globalPrisma) {}

  async save(data: {
    organizationId: string;
    contactId: string;
    dealId: string | null;
    channel: ChannelName;
    direction: 'IN' | 'OUT';
    externalChatId: string;
    externalMessageId: string;
    content: string;
    rawPayload?: unknown;
  }): Promise<SaveMessageResult> {
    try {
      const message = await this.prisma.message.create({
        data: {
          organizationId: data.organizationId,
          contactId: data.contactId,
          dealId: data.dealId,
          channel: data.channel,
          direction: data.direction,
          externalChatId: data.externalChatId,
          externalMessageId: data.externalMessageId,
          content: data.content,
          rawPayload: (data.rawPayload ?? {}) as Prisma.InputJsonValue,
        },
      });
      return { message, created: true };
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;

      const existing = await this.prisma.message.findUnique({
        where: {
          channel_externalChatId_externalMessageId: {
            channel: data.channel,
            externalChatId: data.externalChatId,
            externalMessageId: data.externalMessageId,
          },
        },
      });

      if (!existing) {
       
        throw new Error(
          `[message] Unique violation, but message not found: ${data.channel}/${data.externalChatId}/${data.externalMessageId}`,
        );
      }

      return { message: existing, created: false };
    }
  }

  async findByContact(params: {
    organizationId: string;
    contactId: string;
    limit?: number;
  }): Promise<Message[]> {
    const rows = await this.prisma.message.findMany({
      where: {
        contactId: params.contactId,
        organizationId: params.organizationId,
      },
      orderBy: { createdAt: 'desc' },
      take: clampLimit(params.limit ?? DEFAULT_LIMIT),
    });
    return rows.reverse();
  }

  async findByDeal(params: {
    organizationId: string;
    dealId: string;
    limit?: number;
  }): Promise<Message[]> {
    const rows = await this.prisma.message.findMany({
      where: {
        dealId: params.dealId,
        organizationId: params.organizationId,
      },
      orderBy: { createdAt: 'desc' },
      take: clampLimit(params.limit ?? DEFAULT_LIMIT),
    });
    return rows.reverse();
  }
}

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code: unknown }).code === 'P2002'
  );
}

export const messageService = new MessageService();