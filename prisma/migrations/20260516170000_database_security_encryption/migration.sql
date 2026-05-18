-- Phase 4: optional field encryption columns

ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "isContentEncrypted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "UserOnboardingData" ADD COLUMN IF NOT EXISTS "sensitiveProfileEncrypted" TEXT;
