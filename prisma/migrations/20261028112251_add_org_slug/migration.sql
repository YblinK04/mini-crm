/*
  Warnings:

  - A unique constraint covering the columns `[publicSlug]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "publicSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_publicSlug_key" ON "organizations"("publicSlug");
