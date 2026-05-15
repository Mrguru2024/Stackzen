-- CreateEnum
CREATE TYPE "JobWorkType" AS ENUM (
  'CONTRACTOR_JOB',
  'FREELANCE_PROJECT',
  'GIG_SHIFT',
  'PAYCHECK_CYCLE',
  'SERVICE_BOOKING',
  'SIDE_HUSTLE_TASK',
  'OTHER'
);

-- CreateEnum
CREATE TYPE "JobPaymentType" AS ENUM (
  'INVOICE',
  'PAYCHECK',
  'CASH',
  'PLATFORM_PAYOUT',
  'DIRECT_TRANSFER',
  'CARD',
  'OTHER'
);

-- AlterEnum
ALTER TYPE "FinancialEventType" ADD VALUE 'JOB_CREATED';
ALTER TYPE "FinancialEventType" ADD VALUE 'JOB_UPDATED';
ALTER TYPE "FinancialEventType" ADD VALUE 'JOB_STATUS_CHANGED';

-- AlterEnum
ALTER TYPE "FinancialEventSource" ADD VALUE 'API_JOBS';

-- AlterTable
ALTER TABLE "Job"
ADD COLUMN "workType" "JobWorkType",
ADD COLUMN "paymentType" "JobPaymentType",
ADD COLUMN "sourceLabel" TEXT,
ADD COLUMN "incomeProfileType" "IncomeProfileType";
