-- Add Client.userId for per-user ownership (fixes cross-tenant data leak in /api/clients).
--
-- Step 1: add column as nullable so existing rows survive.
-- Step 2: backfill from earliest related Invoice.userId, falling back to earliest related Job.userId.
-- Step 3: enforce NOT NULL + FK + indexes.
--
-- Orphan clients (no invoices or jobs) will remain NULL and the NOT NULL step will fail by design.
-- Resolve any orphans manually (assign to admin or delete) before applying this migration.

-- Step 1
ALTER TABLE "Client" ADD COLUMN "userId" TEXT;

-- Step 2: backfill from earliest related Invoice
UPDATE "Client" c
SET "userId" = sub."userId"
FROM (
  SELECT DISTINCT ON ("clientId") "clientId", "userId"
  FROM "Invoice"
  ORDER BY "clientId", "createdAt" ASC
) sub
WHERE c."id" = sub."clientId" AND c."userId" IS NULL;

-- Step 2b: fallback backfill from earliest related Job (for clients with no invoices)
UPDATE "Client" c
SET "userId" = sub."userId"
FROM (
  SELECT DISTINCT ON ("clientId") "clientId", "userId"
  FROM "Job"
  ORDER BY "clientId", "createdAt" ASC
) sub
WHERE c."id" = sub."clientId" AND c."userId" IS NULL;

-- Step 3: enforce NOT NULL (will fail if any orphan rows remain — that is intentional)
ALTER TABLE "Client" ALTER COLUMN "userId" SET NOT NULL;

-- FK
ALTER TABLE "Client"
ADD CONSTRAINT "Client_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "Client_userId_idx" ON "Client"("userId");
CREATE INDEX "Client_userId_createdAt_idx" ON "Client"("userId", "createdAt");
