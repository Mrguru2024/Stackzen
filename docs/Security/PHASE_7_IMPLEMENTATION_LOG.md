# Phase 7 — Audit Logging Implementation Log

**Status:** Implemented  
**Date:** 2026-05-16  
**Depends on:** Phases 3–6 (`writeAuditLog` already introduced; this phase centralizes it)

## Objectives

| Requirement | Status |
|-------------|--------|
| Single Prisma writer (`lib/security/audit-log.ts`) | Done |
| Deprecate Supabase writes in `security-audit.ts` | Done — Prisma only |
| Admin `GET /api/admin/audit-logs` contract preserved | Done (+ optional `actionPrefix`) |
| Immutable logs (no UPDATE/DELETE APIs) | Done — 405 on `/api/security/audit-events` mutations |
| Event catalog | `lib/security/audit-catalog.ts` |

## Modules

| File | Purpose |
|------|---------|
| `lib/security/audit-catalog.ts` | `AUDIT_ACTIONS` constants + `isKnownAuditAction` |
| `lib/security/audit-log.ts` | `AuditEvent` type + `writeAuditLog` (only writer) |
| `lib/security/audit-query.ts` | Shared read queries for admin/user UIs |
| `lib/auth/security-audit.ts` | Legacy API shim → Prisma (no Supabase inserts) |

## API routes

| Route | Methods |
|-------|---------|
| `GET /api/security/audit-events` | User-scoped read (+ `stats=true`) |
| `GET /api/admin/audit-logs` | Admin read/export (unchanged shape) |

## Migrations from direct `prisma.auditLog.create`

- `lib/api/require-admin.ts` → `logAdminAudit` → `writeAuditLog`
- `lib/auth/session.ts` → `writeAuditLog` + catalog actions
- `app/api/webhooks/stripe/route.ts` → processed/duplicate audit rows
- `app/api/plaid/webhook/route.ts` → `plaid.webhook_received`

## UI

- `app/(dashboard)/settings/security/audit/page.tsx` now reads via **`/api/security/audit-events`** (NextAuth session) instead of Supabase client.

## Legacy Supabase data

Historical rows in `security_audit_log` (if any) are **not** migrated automatically. New events land in Prisma `AuditLog` only.

## Verification

```bash
npx jest lib/security/__tests__/audit-catalog.test.ts
node scripts/check-financial-owned-queries.mjs
```

## Remaining (Phase 9+)

- Optional backfill job: Supabase `security_audit_log` → Prisma `AuditLog`
- See `PHASE_8_IMPLEMENTATION_LOG.md` for Sentry monitoring (complete)
