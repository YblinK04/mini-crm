-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notify_daily_digest" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notify_on_new_lead" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "owner_email" TEXT,
ADD COLUMN     "smtp_from" TEXT,
ADD COLUMN     "smtp_host" TEXT,
ADD COLUMN     "smtp_last_test_error" VARCHAR(500),
ADD COLUMN     "smtp_last_test_ok" BOOLEAN,
ADD COLUMN     "smtp_last_tested_at" TIMESTAMP(3),
ADD COLUMN     "smtp_password" TEXT,
ADD COLUMN     "smtp_port" INTEGER,
ADD COLUMN     "smtp_secure" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "smtp_user" TEXT;
