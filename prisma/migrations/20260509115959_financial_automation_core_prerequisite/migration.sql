-- Financial automation prerequisite: canonical ledger + Plaid-shaped BankConnection + enums.
-- Must run before:
--   20260509120000_add_cashflow_financial_events
--   20260509120000_smart_allocation_link_transaction (FK -> "FinancialTransaction")

-- -----------------------------------------------------------------------------
-- New enums (safe if already applied via manual SQL)
-- -----------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE "BankConnectionStatus" AS ENUM ('ACTIVE', 'REQUIRES_REAUTH', 'DISCONNECTED', 'ERROR'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "FinancialTransactionSource" AS ENUM ('MANUAL', 'PLAID_SYNC', 'INVOICE_PAYMENT', 'IMPORT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "FinancialTransactionDirection" AS ENUM ('INFLOW', 'OUTFLOW'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TransactionCategoryKind" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AutomationRuleType" AS ENUM ('ALLOCATION', 'GUARDRAIL', 'NOTIFICATION', 'RECURRING_TRANSFER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AutomationTriggerType" AS ENUM ('TRANSACTION_POSTED', 'PAYCHECK_DETECTED', 'SCHEDULED', 'BILL_DUE', 'BALANCE_THRESHOLD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AutomationExecutionStatus" AS ENUM ('SUCCEEDED', 'FAILED', 'SKIPPED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "GuardrailCycle" AS ENUM ('WEEKLY', 'MONTHLY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AutomationNotificationType" AS ENUM ('OVERSPENDING_ALERT', 'PAYCHECK_DETECTED', 'SUBSCRIPTION_INCREASE', 'LOW_BALANCE_WARNING', 'BILL_DUE_REMINDER', 'SAVINGS_MILESTONE', 'AUTOMATION_ACTION'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AutomationNotificationChannel" AS ENUM ('IN_APP', 'EMAIL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BankSyncJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- Extend FinancialEventType / FinancialEventSource / FinancialEntityType (idempotent)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEventType' AND e.enumlabel = 'BANK_CONNECTED') THEN
    ALTER TYPE "FinancialEventType" ADD VALUE 'BANK_CONNECTED';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEventType' AND e.enumlabel = 'BANK_SYNC_COMPLETED') THEN
    ALTER TYPE "FinancialEventType" ADD VALUE 'BANK_SYNC_COMPLETED';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEventType' AND e.enumlabel = 'BANK_SYNC_FAILED') THEN
    ALTER TYPE "FinancialEventType" ADD VALUE 'BANK_SYNC_FAILED';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEventType' AND e.enumlabel = 'TRANSACTION_CREATED') THEN
    ALTER TYPE "FinancialEventType" ADD VALUE 'TRANSACTION_CREATED';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEventType' AND e.enumlabel = 'TRANSACTION_CATEGORIZED') THEN
    ALTER TYPE "FinancialEventType" ADD VALUE 'TRANSACTION_CATEGORIZED';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEventType' AND e.enumlabel = 'RECURRING_TRANSACTION_DETECTED') THEN
    ALTER TYPE "FinancialEventType" ADD VALUE 'RECURRING_TRANSACTION_DETECTED';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEventType' AND e.enumlabel = 'AUTOMATION_RULE_EXECUTED') THEN
    ALTER TYPE "FinancialEventType" ADD VALUE 'AUTOMATION_RULE_EXECUTED';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEventType' AND e.enumlabel = 'AUTOMATION_RULE_FAILED') THEN
    ALTER TYPE "FinancialEventType" ADD VALUE 'AUTOMATION_RULE_FAILED';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEventType' AND e.enumlabel = 'GUARDRAIL_WARNING') THEN
    ALTER TYPE "FinancialEventType" ADD VALUE 'GUARDRAIL_WARNING';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEventType' AND e.enumlabel = 'GUARDRAIL_BREACH') THEN
    ALTER TYPE "FinancialEventType" ADD VALUE 'GUARDRAIL_BREACH';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEventType' AND e.enumlabel = 'AUTOMATION_NOTIFICATION_CREATED') THEN
    ALTER TYPE "FinancialEventType" ADD VALUE 'AUTOMATION_NOTIFICATION_CREATED';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEventSource' AND e.enumlabel = 'API_BANK') THEN
    ALTER TYPE "FinancialEventSource" ADD VALUE 'API_BANK';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEventSource' AND e.enumlabel = 'API_AUTOMATION') THEN
    ALTER TYPE "FinancialEventSource" ADD VALUE 'API_AUTOMATION';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEventSource' AND e.enumlabel = 'JOB_AUTOMATION') THEN
    ALTER TYPE "FinancialEventSource" ADD VALUE 'JOB_AUTOMATION';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEntityType' AND e.enumlabel = 'BANK_CONNECTION') THEN
    ALTER TYPE "FinancialEntityType" ADD VALUE 'BANK_CONNECTION';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEntityType' AND e.enumlabel = 'BANK_ACCOUNT') THEN
    ALTER TYPE "FinancialEntityType" ADD VALUE 'BANK_ACCOUNT';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEntityType' AND e.enumlabel = 'TRANSACTION') THEN
    ALTER TYPE "FinancialEntityType" ADD VALUE 'TRANSACTION';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEntityType' AND e.enumlabel = 'AUTOMATION_RULE') THEN
    ALTER TYPE "FinancialEntityType" ADD VALUE 'AUTOMATION_RULE';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEntityType' AND e.enumlabel = 'AUTOMATION_EXECUTION') THEN
    ALTER TYPE "FinancialEntityType" ADD VALUE 'AUTOMATION_EXECUTION';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEntityType' AND e.enumlabel = 'GUARDRAIL') THEN
    ALTER TYPE "FinancialEntityType" ADD VALUE 'GUARDRAIL';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEntityType' AND e.enumlabel = 'RECURRING_BILL') THEN
    ALTER TYPE "FinancialEntityType" ADD VALUE 'RECURRING_BILL';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'FinancialEntityType' AND e.enumlabel = 'AUTOMATION_NOTIFICATION') THEN
    ALTER TYPE "FinancialEntityType" ADD VALUE 'AUTOMATION_NOTIFICATION';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- BankConnection: create Plaid-style table if missing; otherwise upgrade legacy row shape.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public."BankConnection"') IS NULL THEN
    CREATE TABLE "BankConnection" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "provider" "BankProvider" NOT NULL DEFAULT 'PLAID',
      "status" "BankConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
      "itemId" TEXT NOT NULL,
      "institutionId" TEXT,
      "institutionName" TEXT,
      "accessTokenEncrypted" TEXT NOT NULL,
      "accessTokenLast4" TEXT NOT NULL,
      "syncCursor" TEXT,
      "lastSuccessfulSyncAt" TIMESTAMP(3),
      "lastSyncErrorAt" TIMESTAMP(3),
      "syncErrorCode" TEXT,
      "disconnectedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "BankConnection_pkey" PRIMARY KEY ("id")
    );
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'BankConnection' AND column_name = 'accessToken'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'BankConnection' AND column_name = 'itemId'
  ) THEN
    ALTER TABLE "BankConnection" ADD COLUMN IF NOT EXISTS "provider" "BankProvider" NOT NULL DEFAULT 'PLAID';
    ALTER TABLE "BankConnection" ADD COLUMN IF NOT EXISTS "status" "BankConnectionStatus" NOT NULL DEFAULT 'ACTIVE';
    ALTER TABLE "BankConnection" ADD COLUMN IF NOT EXISTS "itemId" TEXT;
    UPDATE "BankConnection" SET "itemId" = 'legacy_' || "id" WHERE "itemId" IS NULL;
    ALTER TABLE "BankConnection" ALTER COLUMN "itemId" SET NOT NULL;
    ALTER TABLE "BankConnection" ADD COLUMN IF NOT EXISTS "institutionId" TEXT;
    ALTER TABLE "BankConnection" ADD COLUMN IF NOT EXISTS "institutionName" TEXT;
    ALTER TABLE "BankConnection" ADD COLUMN IF NOT EXISTS "accessTokenEncrypted" TEXT;
    ALTER TABLE "BankConnection" ADD COLUMN IF NOT EXISTS "accessTokenLast4" TEXT;
    UPDATE "BankConnection" SET "accessTokenEncrypted" = COALESCE("accessTokenEncrypted", "accessToken"), "accessTokenLast4" = COALESCE("accessTokenLast4", RIGHT(COALESCE("accessToken", ''), 4)) WHERE true;
    ALTER TABLE "BankConnection" ALTER COLUMN "accessTokenEncrypted" SET NOT NULL;
    ALTER TABLE "BankConnection" ALTER COLUMN "accessTokenLast4" SET NOT NULL;
    ALTER TABLE "BankConnection" ADD COLUMN IF NOT EXISTS "syncCursor" TEXT;
    ALTER TABLE "BankConnection" ADD COLUMN IF NOT EXISTS "lastSuccessfulSyncAt" TIMESTAMP(3);
    ALTER TABLE "BankConnection" ADD COLUMN IF NOT EXISTS "lastSyncErrorAt" TIMESTAMP(3);
    ALTER TABLE "BankConnection" ADD COLUMN IF NOT EXISTS "syncErrorCode" TEXT;
    ALTER TABLE "BankConnection" ADD COLUMN IF NOT EXISTS "disconnectedAt" TIMESTAMP(3);
    ALTER TABLE "BankConnection" DROP COLUMN IF EXISTS "accessToken";
    ALTER TABLE "BankConnection" DROP COLUMN IF EXISTS "institution";
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "BankConnection_itemId_key" ON "BankConnection"("itemId");
CREATE INDEX IF NOT EXISTS "BankConnection_userId_idx" ON "BankConnection"("userId");
CREATE INDEX IF NOT EXISTS "BankConnection_provider_idx" ON "BankConnection"("provider");
CREATE INDEX IF NOT EXISTS "BankConnection_status_idx" ON "BankConnection"("status");
CREATE INDEX IF NOT EXISTS "BankConnection_userId_status_idx" ON "BankConnection"("userId", "status");

DO $$ BEGIN
  ALTER TABLE "BankConnection" ADD CONSTRAINT "BankConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- Dependent tables
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "BankAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bankConnectionId" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "officialName" TEXT,
  "mask" TEXT,
  "accountType" TEXT,
  "accountSubtype" TEXT,
  "currentBalance" DOUBLE PRECISION,
  "availableBalance" DOUBLE PRECISION,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TransactionCategory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "TransactionCategoryKind" NOT NULL,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "isPremiumOnly" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TransactionCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FinancialTransaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bankAccountId" TEXT,
  "source" "FinancialTransactionSource" NOT NULL,
  "externalId" TEXT,
  "dedupeHash" TEXT NOT NULL,
  "postedAt" TIMESTAMP(3) NOT NULL,
  "authorizedAt" TIMESTAMP(3),
  "amount" DOUBLE PRECISION NOT NULL,
  "direction" "FinancialTransactionDirection" NOT NULL,
  "description" TEXT NOT NULL,
  "merchantName" TEXT,
  "counterparty" TEXT,
  "categoryId" TEXT,
  "categoryName" TEXT,
  "subcategory" TEXT,
  "isTransfer" BOOLEAN NOT NULL DEFAULT false,
  "isRecurringCandidate" BOOLEAN NOT NULL DEFAULT false,
  "jobId" TEXT,
  "invoiceId" TEXT,
  "expenseId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AutomationRule" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "AutomationRuleType" NOT NULL,
  "triggerType" "AutomationTriggerType" NOT NULL,
  "conditions" JSONB,
  "actions" JSONB NOT NULL,
  "schedule" JSONB,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "premiumRequired" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AutomationExecution" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "ruleId" TEXT NOT NULL,
  "triggerRef" TEXT,
  "status" "AutomationExecutionStatus" NOT NULL DEFAULT 'SUCCEEDED',
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "inputSnapshot" JSONB,
  "resultSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AutomationExecution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SpendingGuardrailPolicy" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "categoryId" TEXT,
  "categoryName" TEXT,
  "cycle" "GuardrailCycle" NOT NULL DEFAULT 'MONTHLY',
  "limitAmount" DOUBLE PRECISION NOT NULL,
  "warnAtPercent" INTEGER NOT NULL DEFAULT 80,
  "softBlockEnabled" BOOLEAN NOT NULL DEFAULT false,
  "aiCoachModeEnabled" BOOLEAN NOT NULL DEFAULT false,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SpendingGuardrailPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RecurringBill" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "categoryId" TEXT,
  "categoryName" TEXT,
  "nextDueDate" TIMESTAMP(3) NOT NULL,
  "frequency" TEXT NOT NULL,
  "autopayEnabled" BOOLEAN NOT NULL DEFAULT false,
  "reminderDaysBefore" INTEGER NOT NULL DEFAULT 3,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "lastTriggeredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecurringBill_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AutomationNotification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "AutomationNotificationType" NOT NULL,
  "channel" "AutomationNotificationChannel" NOT NULL DEFAULT 'IN_APP',
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "severity" "NotificationSeverity" NOT NULL DEFAULT 'INFO',
  "readAt" TIMESTAMP(3),
  "relatedEntityType" "FinancialEntityType",
  "relatedEntityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AutomationNotification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BankSyncJob" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bankConnectionId" TEXT NOT NULL,
  "status" "BankSyncJobStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BankSyncJob_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "BankAccount_userId_idx" ON "BankAccount"("userId");
CREATE INDEX IF NOT EXISTS "BankAccount_bankConnectionId_idx" ON "BankAccount"("bankConnectionId");
CREATE UNIQUE INDEX IF NOT EXISTS "BankAccount_bankConnectionId_providerAccountId_key" ON "BankAccount"("bankConnectionId", "providerAccountId");

CREATE INDEX IF NOT EXISTS "TransactionCategory_userId_idx" ON "TransactionCategory"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "TransactionCategory_userId_name_kind_key" ON "TransactionCategory"("userId", "name", "kind");

CREATE INDEX IF NOT EXISTS "FinancialTransaction_userId_idx" ON "FinancialTransaction"("userId");
CREATE INDEX IF NOT EXISTS "FinancialTransaction_bankAccountId_idx" ON "FinancialTransaction"("bankAccountId");
CREATE INDEX IF NOT EXISTS "FinancialTransaction_externalId_idx" ON "FinancialTransaction"("externalId");
CREATE INDEX IF NOT EXISTS "FinancialTransaction_postedAt_idx" ON "FinancialTransaction"("postedAt");
CREATE INDEX IF NOT EXISTS "FinancialTransaction_userId_postedAt_idx" ON "FinancialTransaction"("userId", "postedAt");
CREATE INDEX IF NOT EXISTS "FinancialTransaction_source_idx" ON "FinancialTransaction"("source");
CREATE INDEX IF NOT EXISTS "FinancialTransaction_direction_idx" ON "FinancialTransaction"("direction");
CREATE UNIQUE INDEX IF NOT EXISTS "FinancialTransaction_userId_dedupeHash_key" ON "FinancialTransaction"("userId", "dedupeHash");

CREATE INDEX IF NOT EXISTS "AutomationRule_userId_idx" ON "AutomationRule"("userId");
CREATE INDEX IF NOT EXISTS "AutomationRule_userId_enabled_idx" ON "AutomationRule"("userId", "enabled");
CREATE INDEX IF NOT EXISTS "AutomationRule_triggerType_idx" ON "AutomationRule"("triggerType");
CREATE INDEX IF NOT EXISTS "AutomationRule_type_idx" ON "AutomationRule"("type");

CREATE INDEX IF NOT EXISTS "AutomationExecution_userId_idx" ON "AutomationExecution"("userId");
CREATE INDEX IF NOT EXISTS "AutomationExecution_ruleId_idx" ON "AutomationExecution"("ruleId");
CREATE INDEX IF NOT EXISTS "AutomationExecution_status_idx" ON "AutomationExecution"("status");
CREATE INDEX IF NOT EXISTS "AutomationExecution_createdAt_idx" ON "AutomationExecution"("createdAt");

CREATE INDEX IF NOT EXISTS "SpendingGuardrailPolicy_userId_idx" ON "SpendingGuardrailPolicy"("userId");
CREATE INDEX IF NOT EXISTS "SpendingGuardrailPolicy_userId_enabled_idx" ON "SpendingGuardrailPolicy"("userId", "enabled");

CREATE INDEX IF NOT EXISTS "RecurringBill_userId_idx" ON "RecurringBill"("userId");
CREATE INDEX IF NOT EXISTS "RecurringBill_nextDueDate_idx" ON "RecurringBill"("nextDueDate");

CREATE INDEX IF NOT EXISTS "AutomationNotification_userId_idx" ON "AutomationNotification"("userId");
CREATE INDEX IF NOT EXISTS "AutomationNotification_type_idx" ON "AutomationNotification"("type");
CREATE INDEX IF NOT EXISTS "AutomationNotification_channel_idx" ON "AutomationNotification"("channel");
CREATE INDEX IF NOT EXISTS "AutomationNotification_createdAt_idx" ON "AutomationNotification"("createdAt");

CREATE INDEX IF NOT EXISTS "BankSyncJob_userId_idx" ON "BankSyncJob"("userId");
CREATE INDEX IF NOT EXISTS "BankSyncJob_bankConnectionId_idx" ON "BankSyncJob"("bankConnectionId");
CREATE INDEX IF NOT EXISTS "BankSyncJob_status_scheduledAt_idx" ON "BankSyncJob"("status", "scheduledAt");

-- Foreign keys (idempotent)
DO $$ BEGIN ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_bankConnectionId_fkey" FOREIGN KEY ("bankConnectionId") REFERENCES "BankConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "TransactionCategory" ADD CONSTRAINT "TransactionCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TransactionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "AutomationExecution" ADD CONSTRAINT "AutomationExecution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "AutomationExecution" ADD CONSTRAINT "AutomationExecution_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SpendingGuardrailPolicy" ADD CONSTRAINT "SpendingGuardrailPolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "RecurringBill" ADD CONSTRAINT "RecurringBill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "AutomationNotification" ADD CONSTRAINT "AutomationNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "BankSyncJob" ADD CONSTRAINT "BankSyncJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "BankSyncJob" ADD CONSTRAINT "BankSyncJob_bankConnectionId_fkey" FOREIGN KEY ("bankConnectionId") REFERENCES "BankConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
