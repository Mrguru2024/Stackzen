-- Phase 6: AI consent / privacy on UserSettings + AiInteractionLog

ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "aiConsentAt" TIMESTAMP(3);
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "aiMemoryEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "aiOptOut" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "AiInteractionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInteractionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AiInteractionLog_userId_idx" ON "AiInteractionLog"("userId");
CREATE INDEX IF NOT EXISTS "AiInteractionLog_userId_createdAt_idx" ON "AiInteractionLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AiInteractionLog_action_idx" ON "AiInteractionLog"("action");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AiInteractionLog_userId_fkey'
  ) THEN
    ALTER TABLE "AiInteractionLog" ADD CONSTRAINT "AiInteractionLog_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
