-- Mentor vetting & onboarding workflow
CREATE TYPE "MentorApplicationStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'SETUP_COMPLETE', 'REJECTED');

ALTER TABLE "Mentor" ADD COLUMN IF NOT EXISTS "applicationStatus" "MentorApplicationStatus" NOT NULL DEFAULT 'PENDING_REVIEW';
ALTER TABLE "Mentor" ADD COLUMN IF NOT EXISTS "documentsSubmittedAt" TIMESTAMP(3);
ALTER TABLE "Mentor" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);
ALTER TABLE "Mentor" ADD COLUMN IF NOT EXISTS "vettingNotes" TEXT;
ALTER TABLE "Mentor" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- Existing verified mentors are treated as fully onboarded
UPDATE "Mentor"
SET "applicationStatus" = 'SETUP_COMPLETE',
    "onboardingCompletedAt" = COALESCE("onboardingCompletedAt", "updatedAt")
WHERE "isVerified" = true AND "applicationStatus" = 'PENDING_REVIEW';
