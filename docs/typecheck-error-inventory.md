# TypeScript Error Inventory (`npx tsc --noEmit`)

Fresh run source: `.cursor-tsc-errors.txt` generated on 2026-05-07 via:

`npx tsc --noEmit 2>&1 | Out-File -FilePath ".cursor-tsc-errors.txt" -Encoding utf8`

Total error lines detected: **5465**

## Required category grouping

### 1. `app/api` runtime errors

- Count (by path prefix): **109**
- Common patterns:
  - Prisma field mismatches in aggregated-gigs and analytics routes
  - Missing fields on selected model payloads
  - legacy enum/string comparisons in route guards
- Examples:
  - `app/api/aggregated-gigs/[id]/curated/route.ts` (`curated` not in Prisma input/select)
  - `app/api/aggregated-gigs/route.ts` (`favoriteGigIds` not on `User`)
  - `app/api/analytics/route.ts` (`amount` mismatches current session model)

### 2. `lib/auth/security/payment` errors

- Count (targeted prefix scan): **359**
- Common patterns:
  - legacy `_`-prefixed export/import drift
  - incomplete auth utilities (`device-fingerprint`, `session`, `two-factor`)
  - mixed old/new third-party typings in auth flow
- Examples:
  - `lib/auth/device-fingerprint.ts`
  - `lib/auth/session.ts`
  - `lib/auth/two-factor.ts`

### 3. Prisma model field mismatch errors

- Count (TS2353 occurrences): **107**
- Common patterns:
  - object literals containing fields not present in Prisma input/select types
  - route queries still aligned to older model fields
- Examples:
  - `app/api/aggregated-gigs/*` (`curated`, `tags`, `internalApplication`)
  - `app/api/analytics/route.ts` (`amount`, `status` shape drift)
  - `app/admin/dashboard/page.tsx` (`lastLoginAt` vs `lastLogin`)

### 4. component/UI prop errors

- Count (components path prefix): **3308**
- Common patterns:
  - missing props and incorrect prop names
  - unresolved UI symbols and icon exports
  - form schema/field type mismatch in dashboard pages
- Examples:
  - `components/admin/AdminMentorManagement.tsx`
  - `app/(dashboard)/blog/page.tsx` (`asChild` prop mismatch on Button)
  - `app/(dashboard)/income/challenges/create/page.tsx` form resolver mismatches

### 5. test/mock errors

- Count (test file patterns): **345**
- Common patterns:
  - `.tsx` extension import errors (`TS5097`)
  - mock shape mismatches vs runtime modules
  - conflicting declarations in colocated page tests
- Examples:
  - `app/admin/dashboard/page.test.tsx`
  - `app/developer/dashboard/page.test.tsx`
  - `components/affiliates/Affiliates.test.tsx`

### 6. dev-only files

- Count (dev/test utility routes/pages): **135**
- Common patterns:
  - incomplete developer tooling pages
  - duplicate symbols and missing internal types
- Examples:
  - `app/dev/performance/page.tsx`
  - `app/dev-tools/page.tsx`

## Phase 1 production gate note

A narrowed production gate was created in `tsconfig.phase1-production.json` and validated clean with:

`npx tsc --noEmit -p tsconfig.phase1-production.json`

This does **not** hide production errors in the scoped Phase 1 lock surface; it isolates that surface from unresolved dev/test and unrelated backlog areas.
