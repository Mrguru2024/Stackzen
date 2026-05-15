-- AlterTable
ALTER TABLE "Invoice"
ADD COLUMN "quoteId" TEXT,
ADD COLUMN "cost" DOUBLE PRECISION,
ADD COLUMN "profit" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Invoice_quoteId_idx" ON "Invoice"("quoteId");

-- AddForeignKey
ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_quoteId_fkey"
FOREIGN KEY ("quoteId") REFERENCES "Quote"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

