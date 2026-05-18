# Phase 3 — Auth Hardening Implementation Log

**Status:** Implemented  
**Date:** 2026-05-16  
**Depends on:** Phase 2 (`lib/security/*`, `lib/api/with-security.ts`, `proxy.ts`)

## Objectives

1. MFA foundation (Prisma fields + real encryption for TOTP secrets)
2. Session / device tracking (`UserSession` model)
3. Login risk evaluation (log + challenge, non-aggressive block)
4. Admin MFA gate (`MFA_REQUIRED`)
5. WebAuthn stub behind `ENABLE_WEBAUTHN`

## Schema (Prisma migration `20260516160000_auth_hardening_user_session`)

**User (additive):**

- `twoFactorSecret` — AES-256-GCM via `lib/security/encryption.ts`
- `mfaRequired`, `webAuthnEnabled`, `passkeyPreferred`

**New model `UserSession`:**

- Hashed IP / user-agent (`lib/security/hash.ts`)
- `deviceLabel`, `lastActiveAt`, `revokedAt`, `revokedReason`
- Max 5 active sessions per user (oldest revoked)

## New modules

| Module | Purpose |
|--------|---------|
| `lib/security/audit-log.ts` | Central Prisma `AuditLog` writer |
| `lib/security/hash.ts` | IP / UA hashing with pepper |
| `lib/security/user-session.ts` | Record, list, revoke sessions |
| `lib/security/login-risk.ts` | Post-login risk signals |
| `lib/security/request-meta.ts` | IP + UA from `headers()` |
| `lib/auth/webauthn.ts` | Feature-flagged passkey stub |

## Updated integrations

- `lib/auth/security.ts` — real encrypt/decrypt; no `as any`
- `lib/auth/two-factor.ts` — persists encrypted secret to Prisma on verify
- `lib/auth-config.ts` — login risk + `UserSession` on credentials/OAuth sign-in
- `lib/api/require-admin.ts` — `403` + `code: MFA_REQUIRED` for admins without MFA
- `app/api/admin/devices/*` — reads `UserSession` instead of Redis `device:*`

## Environment

```env
SESSION_HASH_PEPPER=""      # optional; falls back to BANK_TOKEN_ENCRYPTION_KEY
ENABLE_WEBAUTHN="false"
LOGIN_GEO_ENABLED="false"   # placeholder for geo / impossible-travel logging
```

## Operational notes

- **Admin MFA:** All `ADMIN` / `SUPER_ADMIN` / privileged emails must enable TOTP before admin APIs/layout succeed. Enroll via `/api/auth/2fa/*`.
- **Redis `device:*` keys:** No longer written on login; legacy keys may remain until TTL expires.
- **Failed logins:** Recorded via `evaluateLoginRisk` on credential failures when email is known.

## Verification

```bash
npx prisma generate
npx prisma migrate deploy   # or migrate dev locally
npx jest lib/security/__tests__/hash.test.ts lib/security/__tests__/login-risk.test.ts lib/api/__tests__/require-admin-mfa.test.ts
```

## Remaining (Phase 4+)

- Roll `with-security` across all API routes
- WebAuthn registration/authentication ceremonies
- Credential login step-up when `challengeMfa` is true
- Geo IP provider for `LOGIN_GEO_ENABLED`
- Backup codes stored encrypted in DB (still Redis-only today)
