/*
  Warnings:

  - Made the column `url` on table `stackzengig` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "stackzengig" ALTER COLUMN "url" SET NOT NULL;
