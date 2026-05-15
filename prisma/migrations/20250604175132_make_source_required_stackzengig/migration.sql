/*
  Warnings:

  - Made the column `source` on table `stackzengig` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "stackzengig" ALTER COLUMN "source" SET NOT NULL;
