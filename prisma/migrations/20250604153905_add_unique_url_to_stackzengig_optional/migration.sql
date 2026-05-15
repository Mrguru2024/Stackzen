/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `stackzengig` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "stackzengig" ADD COLUMN     "url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "stackzengig_url_key" ON "stackzengig"("url");
