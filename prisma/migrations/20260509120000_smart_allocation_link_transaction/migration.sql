-- Link automation-driven SmartAllocation rows to FinancialTransaction for idempotent replay (re-sync / re-categorization).

ALTER TABLE "SmartAllocation" ADD COLUMN "financialTransactionId" TEXT;

CREATE INDEX "SmartAllocation_financialTransactionId_idx" ON "SmartAllocation"("financialTransactionId");

CREATE UNIQUE INDEX "SmartAllocation_financialTransactionId_bucketId_key" ON "SmartAllocation"("financialTransactionId", "bucketId");

ALTER TABLE "SmartAllocation" ADD CONSTRAINT "SmartAllocation_financialTransactionId_fkey" FOREIGN KEY ("financialTransactionId") REFERENCES "FinancialTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
