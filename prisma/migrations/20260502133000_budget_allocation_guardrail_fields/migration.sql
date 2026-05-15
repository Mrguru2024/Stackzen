-- AlterTable
ALTER TABLE "BudgetAllocation" ADD COLUMN "spent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "BudgetAllocation" ADD COLUMN "notifications" BOOLEAN NOT NULL DEFAULT true;
