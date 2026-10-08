/*
  Warnings:

  - A unique constraint covering the columns `[organization_id,telegram_chat_id]` on the table `contacts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organization_id,max_user_id]` on the table `contacts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "max_user_id" TEXT,
ADD COLUMN     "telegram_chat_id" TEXT,
ADD COLUMN     "telegram_username" TEXT;

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "deal_id" TEXT,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "external_chat_id" TEXT NOT NULL,
    "external_message_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "organization_id" TEXT NOT NULL,
    "telegram_bot_token" TEXT,
    "telegram_webhook_secret" TEXT,
    "telegram_bot_username" TEXT,
    "max_bot_token" TEXT,
    "max_webhook_secret" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_organization_id_contact_id_created_at_idx" ON "messages"("organization_id", "contact_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_deal_id_created_at_idx" ON "messages"("deal_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "messages_channel_external_chat_id_external_message_id_key" ON "messages"("channel", "external_chat_id", "external_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_organization_id_key" ON "settings"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_organization_id_telegram_chat_id_key" ON "contacts"("organization_id", "telegram_chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_organization_id_max_user_id_key" ON "contacts"("organization_id", "max_user_id");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
