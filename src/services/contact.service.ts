
import { PrismaClient, Contact } from '@prisma/client';
import { prisma as globalPrisma } from '@/lib/prisma';
import type { ChannelName } from '@/lib/channels/types';

const DEFAULT_DISPLAY_NAME = 'Без имени';

export class ContactService {
  constructor(private prisma: PrismaClient = globalPrisma) {}

  async findOrCreateByExternalId(params: {
    organizationId: string;
    channel: ChannelName;
    externalId: string;
    displayName?: string;
    username?: string;
  }): Promise<Contact> {
    const base = {
      organizationId: params.organizationId,
      firstName: params.displayName ?? DEFAULT_DISPLAY_NAME,
    };

    if (params.channel === 'TELEGRAM') {
      return this.prisma.contact.upsert({
        where: {
          organizationId_telegramChatId: {
            organizationId: params.organizationId,
            telegramChatId: params.externalId,
          },
        },
        create: {
          ...base,
          telegramChatId: params.externalId,
          telegramUsername: params.username ?? null,
        },
        update: {}, // существующий контакт не трогаем
      });
    }

    if (params.channel === 'MAX') {
      return this.prisma.contact.upsert({
        where: {
          organizationId_maxUserId: {
            organizationId: params.organizationId,
            maxUserId: params.externalId,
          },
        },
        create: {
          ...base,
          maxUserId: params.externalId,
        },
        update: {},
      });
    }

    const _exhaustive: never = params.channel;
    throw new Error(`[contact] Unsupported channel: ${String(_exhaustive)}`);
  }

  async findByExternalId(params: {
    organizationId: string;
    channel: ChannelName;
    externalId: string;
  }): Promise<Contact | null> {
    if (params.channel === 'TELEGRAM') {
      return this.prisma.contact.findUnique({
        where: {
          organizationId_telegramChatId: {
            organizationId: params.organizationId,
            telegramChatId: params.externalId,
          },
        },
      });
    }

    if (params.channel === 'MAX') {
      return this.prisma.contact.findUnique({
        where: {
          organizationId_maxUserId: {
            organizationId: params.organizationId,
            maxUserId: params.externalId,
          },
        },
      });
    }

    const _exhaustive: never = params.channel;
    throw new Error(`[contact] Unsupported channel: ${String(_exhaustive)}`);
  }
}

export const contactService = new ContactService();