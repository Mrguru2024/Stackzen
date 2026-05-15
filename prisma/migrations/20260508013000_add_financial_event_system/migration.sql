-- CreateEnum
CREATE TYPE "FinancialEventType" AS ENUM (
  'INVOICE_CREATED',
  'INVOICE_UPDATED',
  'INVOICE_STATUS_CHANGED',
  'QUOTE_CREATED',
  'QUOTE_CONVERTED',
  'EXPENSE_CREATED',
  'EXPENSE_UPDATED',
  'EXPENSE_DELETED',
  'INCOME_PROFILE_UPDATED'
);

-- CreateEnum
CREATE TYPE "FinancialEventSource" AS ENUM (
  'API_INVOICES',
  'API_QUOTES',
  'API_EXPENSES',
  'API_INCOME_PROFILES'
);

-- CreateEnum
CREATE TYPE "FinancialEntityType" AS ENUM (
  'INVOICE',
  'QUOTE',
  'EXPENSE',
  'INCOME_PROFILE',
  'JOB'
);

-- CreateTable
CREATE TABLE "FinancialEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "FinancialEventType" NOT NULL,
  "source" "FinancialEventSource" NOT NULL,
  "amount" DOUBLE PRECISION,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "metadata" JSONB,
  "relatedEntityType" "FinancialEntityType",
  "relatedEntityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinancialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialEvent_userId_idx" ON "FinancialEvent"("userId");
CREATE INDEX "FinancialEvent_createdAt_idx" ON "FinancialEvent"("createdAt");
CREATE INDEX "FinancialEvent_userId_createdAt_idx" ON "FinancialEvent"("userId", "createdAt");
CREATE INDEX "FinancialEvent_type_idx" ON "FinancialEvent"("type");
CREATE INDEX "FinancialEvent_source_idx" ON "FinancialEvent"("source");
CREATE INDEX "FinancialEvent_relatedEntityType_relatedEntityId_idx" ON "FinancialEvent"("relatedEntityType", "relatedEntityId");

-- AddForeignKey
ALTER TABLE "FinancialEvent"
ADD CONSTRAINT "FinancialEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

