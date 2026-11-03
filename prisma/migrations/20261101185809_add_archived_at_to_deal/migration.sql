-- DropIndex
DROP INDEX "deals_organization_id_pipeline_id_stage_id_idx";

-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "archived_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "deals_organization_id_pipeline_id_stage_id_archived_at_idx" ON "deals"("organization_id", "pipeline_id", "stage_id", "archived_at");
