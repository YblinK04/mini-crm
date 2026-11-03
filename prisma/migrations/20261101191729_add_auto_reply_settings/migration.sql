-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "auto_reply_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "auto_reply_text" VARCHAR(4000);
