/*
  Warnings:

  - A unique constraint covering the columns `[public_token]` on the table `deals` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "public_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "deals_public_token_key" ON "deals"("public_token");
