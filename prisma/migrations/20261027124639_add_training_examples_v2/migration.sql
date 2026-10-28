-- CreateEnum
CREATE TYPE "TrainingLabel" AS ENUM ('LEAD', 'SPAM', 'COMPLAINT', 'OTHER');

-- CreateTable
CREATE TABLE "training_examples" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "label" "TrainingLabel" NOT NULL,
    "source_message_id" TEXT,
    "created_by_id" TEXT,
    "is_test" BOOLEAN NOT NULL DEFAULT false,
    "tokens" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_examples_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "training_examples_organization_id_label_idx" ON "training_examples"("organization_id", "label");

-- CreateIndex
CREATE INDEX "training_examples_organization_id_is_test_idx" ON "training_examples"("organization_id", "is_test");

-- CreateIndex
CREATE INDEX "training_examples_source_message_id_idx" ON "training_examples"("source_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_examples_organization_id_text_key" ON "training_examples"("organization_id", "text");

-- AddForeignKey
ALTER TABLE "training_examples" ADD CONSTRAINT "training_examples_source_message_id_fkey" FOREIGN KEY ("source_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_examples" ADD CONSTRAINT "training_examples_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_examples" ADD CONSTRAINT "training_examples_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
