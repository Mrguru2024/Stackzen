-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM (
  'NEW',
  'QUOTED',
  'APPROVED',
  'DEPOSIT_PENDING',
  'IN_PROGRESS',
  'AWAITING_PAYMENT',
  'PAID',
  'COMPLETED',
  'CLOSED'
);

-- CreateTable
CREATE TABLE "Job" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "serviceId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "JobStatus" NOT NULL DEFAULT 'NEW',
  "estimatedAmount" DOUBLE PRECISION,
  "depositPercentage" DOUBLE PRECISION DEFAULT 0,
  "depositPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "remainingBalance" DOUBLE PRECISION,
  "jobRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "jobExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "estimatedProfit" DOUBLE PRECISION,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "jobId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "invoiceType" TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE "Quote" ADD COLUMN "jobId" TEXT;
ALTER TABLE "Expense" ADD COLUMN "jobId" TEXT;

-- CreateIndex
CREATE INDEX "Invoice_jobId_idx" ON "Invoice"("jobId");
CREATE INDEX "Invoice_jobId_invoiceType_idx" ON "Invoice"("jobId", "invoiceType");
CREATE INDEX "Quote_jobId_idx" ON "Quote"("jobId");
CREATE INDEX "Expense_jobId_idx" ON "Expense"("jobId");
CREATE INDEX "Job_userId_idx" ON "Job"("userId");
CREATE INDEX "Job_clientId_idx" ON "Job"("clientId");
CREATE INDEX "Job_serviceId_idx" ON "Job"("serviceId");
CREATE INDEX "Job_status_idx" ON "Job"("status");
CREATE INDEX "Job_userId_status_idx" ON "Job"("userId", "status");
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");

-- CreateTable (implicit m2m for JobAssignments)
CREATE TABLE "_JobAssignments" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_JobAssignments_AB_unique" ON "_JobAssignments"("A", "B");
CREATE INDEX "_JobAssignments_B_index" ON "_JobAssignments"("B");

-- AddForeignKey
ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "Job"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Quote"
ADD CONSTRAINT "Quote_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "Job"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Expense"
ADD CONSTRAINT "Expense_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "Job"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Job"
ADD CONSTRAINT "Job_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Job"
ADD CONSTRAINT "Job_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Job"
ADD CONSTRAINT "Job_serviceId_fkey"
FOREIGN KEY ("serviceId") REFERENCES "Service"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "_JobAssignments"
ADD CONSTRAINT "_JobAssignments_A_fkey"
FOREIGN KEY ("A") REFERENCES "Job"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_JobAssignments"
ADD CONSTRAINT "_JobAssignments_B_fkey"
FOREIGN KEY ("B") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

