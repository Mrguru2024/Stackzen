-- Add Stripe Connect (Standard) onboarding fields to User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "stripeAccountId"          TEXT,
  ADD COLUMN IF NOT EXISTS "stripeChargesEnabled"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "stripePayoutsEnabled"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "stripeDetailsSubmitted"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "stripeAccountStatus"      TEXT,
  ADD COLUMN IF NOT EXISTS "stripeAccountConnectedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "stripeAccountSyncedAt"    TIMESTAMP(3);

-- One Stripe Connected Account per user
CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeAccountId_key" ON "User" ("stripeAccountId");
CREATE INDEX        IF NOT EXISTS "User_stripeAccountId_idx" ON "User" ("stripeAccountId");

-- Add payable-invoice fields to Invoice
ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "paidAt"                 TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paymentEnabled"         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "stripeInvoiceId"        TEXT,
  ADD COLUMN IF NOT EXISTS "stripePaymentIntentId"  TEXT,
  ADD COLUMN IF NOT EXISTS "stripeHostedInvoiceUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeInvoicePdfUrl"    TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_stripeInvoiceId_key"        ON "Invoice" ("stripeInvoiceId");
CREATE INDEX        IF NOT EXISTS "Invoice_stripePaymentIntentId_idx"  ON "Invoice" ("stripePaymentIntentId");
