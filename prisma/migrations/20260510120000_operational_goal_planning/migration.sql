-- Operational goal planning + SmartAllocation ↔ FinancialTransaction link (idempotent where noted).

-- Enums for operational goals
CREATE TYPE "OperationalGoalKind" AS ENUM (
  'EMERGENCY_FUND',
  'DEBT_PAYOFF',
  'TAX_RESERVE',
  'EQUIPMENT_PURCHASE',
  'MOVING_FUND',
  'VACATION',
  'BUSINESS_RESERVE',
  'RUNWAY',
  'CUSTOM'
);

CREATE TYPE "GoalAutomationMode" AS ENUM (
  'MANUAL_ONLY',
  'FIXED_CONTRIBUTION',
  'PERCENT_OF_INCOME',
  'ROUND_UP',
  'SURPLUS_PERCENT',
  'PAYCHECK_SPLIT',
  'CONTRACTOR_PERCENT'
);

CREATE TYPE "OperationalGoalStatus" AS ENUM (
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'ARCHIVED'
);

-- Extend existing Prisma enums
ALTER TYPE "FinancialEventType" ADD VALUE 'GOAL_CREATED';
ALTER TYPE "FinancialEventType" ADD VALUE 'GOAL_UPDATED';
ALTER TYPE "FinancialEventType" ADD VALUE 'GOAL_MILESTONE_REACHED';
ALTER TYPE "FinancialEventType" ADD VALUE 'GOAL_RISK_EVALUATED';
ALTER TYPE "FinancialEventType" ADD VALUE 'GOAL_CONTRIBUTION_RECORDED';

ALTER TYPE "FinancialEventSource" ADD VALUE 'API_GOALS';

ALTER TYPE "FinancialEntityType" ADD VALUE 'OPERATIONAL_GOAL';

ALTER TYPE "AutomationNotificationType" ADD VALUE 'GOAL_PACE_WARNING';
ALTER TYPE "AutomationNotificationType" ADD VALUE 'GOAL_UNSAFE_CONTRIBUTION';
ALTER TYPE "AutomationNotificationType" ADD VALUE 'GOAL_MILESTONE';
ALTER TYPE "AutomationNotificationType" ADD VALUE 'GOAL_FORECAST_CONFLICT';

-- SmartAllocation.financialTransactionId (skip if already applied by prior migration)
ALTER TABLE "SmartAllocation" ADD COLUMN IF NOT EXISTS "financialTransactionId" TEXT;

CREATE INDEX IF NOT EXISTS "SmartAllocation_financialTransactionId_idx" ON "SmartAllocation"("financialTransactionId");

DO $$
BEGIN
  ALTER TABLE "SmartAllocation"
    ADD CONSTRAINT "SmartAllocation_financialTransactionId_fkey"
    FOREIGN KEY ("financialTransactionId") REFERENCES "FinancialTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE "OperationalGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goalKind" "OperationalGoalKind" NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "targetDate" TIMESTAMP(3),
    "smartBucketId" TEXT NOT NULL,
    "automationMode" "GoalAutomationMode" NOT NULL DEFAULT 'MANUAL_ONLY',
    "automationConfig" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "status" "OperationalGoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastContributionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalGoal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalGoal_userId_idx" ON "OperationalGoal"("userId");
CREATE INDEX "OperationalGoal_userId_status_idx" ON "OperationalGoal"("userId", "status");
CREATE INDEX "OperationalGoal_smartBucketId_idx" ON "OperationalGoal"("smartBucketId");

ALTER TABLE "OperationalGoal" ADD CONSTRAINT "OperationalGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalGoal" ADD CONSTRAINT "OperationalGoal_smartBucketId_fkey" FOREIGN KEY ("smartBucketId") REFERENCES "SmartBucket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
