# Phase 4 — Database Security Implementation Log

**Status:** Implemented  
**Date:** 2026-05-16  
**Depends on:** Phase 3 (encryption key used for TOTP + Plaid tokens)

## Objectives

1. Row-level ownership helpers (`lib/db/owned.ts`)
2. Production encryption key enforcement (no `NEXTAUTH_SECRET` fallback in prod)
3. `encryptJson` / `decryptJson` for structured sensitive fields
4. Optional encryption for AI chat + onboarding profile JSON
5. Bank connection safe selects (never leak `accessTokenEncrypted`)
6. Invoice route IDOR fixes (proof pattern)
7. Public env audit script

## Schema (migration `20260516170000_database_security_encryption`)

- `ChatMessage.isContentEncrypted` (default `false`)
- `UserOnboardingData.sensitiveProfileEncrypted` (nullable)

## New / updated modules

| Module | Purpose |
|--------|---------|
| `lib/db/owned.ts` | `findOwnedFirst`, `findOwnedOrThrow`, `ownedWhere` |
| `lib/db/bank-connection.ts` | `bankConnectionPublicSelect`, `toPublicBankConnection` |
| `lib/security/encryption.ts` | Prod key required; `encryptJson` / `decryptJson` |
| `lib/security/chat-content.ts` | Chat encrypt/decrypt (`ENCRYPT_CHAT_CONTENT`) |
| `lib/security/onboarding-sensitive.ts` | Onboarding blob (`ENCRYPT_ONBOARDING_SENSITIVE`) |
| `lib/security/public-env.ts` | Audit `NEXT_PUBLIC_*` for secret-like values |
| `lib/ai/chat-persistence.ts` | Save/list chat with encryption |

## Route updates

- `app/api/invoices/[invoiceId]/*` — owned queries + composite delete
- `app/api/invoices/[invoiceId]/[id]/route.ts` — fixed IDOR on GET/PATCH/DELETE
- `app/api/income/sources/route.ts` — public bank select + onboarding pack/unpack
- `app/api/money-mentor/route.ts` — persists chat via `saveChatMessage`
- `components/ai-personalization` — decrypts chat on read

## Environment

```env
BANK_TOKEN_ENCRYPTION_KEY=""   # Required in production (32+ chars)
ENCRYPT_CHAT_CONTENT="false"   # Set true to encrypt ChatMessage.content at rest
ENCRYPT_ONBOARDING_SENSITIVE="false"
```

## CI / scripts

```bash
node scripts/check-public-env.mjs
node scripts/check-financial-owned-queries.mjs
npx jest lib/security/__tests__/encryption.test.ts lib/db/__tests__/owned.test.ts lib/security/__tests__/public-env.test.ts
```

## Verification

```bash
npx prisma generate
npx prisma migrate deploy
```

## Remaining (Phase 5+)

- Full financial API sweep with `findOwnedFirst` (script lists stragglers)
- `lib/security/redact.ts` for logs/Sentry
- Mentor session `notes` encryption
- Backfill job for existing plaintext chat/onboarding rows when flags enabled
