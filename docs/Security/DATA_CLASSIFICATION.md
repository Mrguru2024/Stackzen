# StackZen Data Classification

**Owner:** Engineering / Security  
**Last updated:** 2026-05-16  
**Scope:** All data processed by StackZen (Next.js app, Prisma/Postgres, Supabase Auth, third-party processors).

This document defines classification tiers, handling rules, and where each category lives in the codebase. It satisfies Phase 4/5 (database & financial protection) documentation requirements.

---

## Classification tiers

| Tier | Label | Examples | Confidentiality | Integrity | Availability |
|------|--------|----------|-----------------|-----------|--------------|
| **T0** | Public | Marketing copy, public pricing, static assets | Low | Medium | High |
| **T1** | Internal operational | Aggregated metrics, non-PII audit metadata, feature flags | Medium | High | High |
| **T2** | PII | Name, email, profile image, device labels, IP (raw) | High | High | High |
| **T3** | Financial | Invoices, income/expense ledgers, bank account metadata, Plaid item IDs | High | Critical | High |
| **T4** | Secrets & credentials | Plaid access tokens, TOTP secrets, API keys, session tokens, webhook secrets | Critical | Critical | Medium |

**Rule of thumb:** classify at the **highest** tier present in a record or payload.

---

## T0 — Public

| Data | Storage | Client exposure | Logging |
|------|---------|---------------|---------|
| Landing/marketing content | CMS / static | `NEXT_PUBLIC_*` non-secret URLs only | Allowed |
| Published plan names/prices | Stripe Dashboard + env price IDs | Public pricing pages | Allowed |

**Controls:** `node scripts/check-public-env.mjs` — no secret-like values in `NEXT_PUBLIC_*`.

---

## T1 — Internal operational

| Data | Storage | Access |
|------|---------|--------|
| Audit action names, severities | Prisma `AuditLog` | User (own), Admin (masked by default) |
| Rate-limit bucket counters | Upstash Redis | Server only |
| AI interaction metadata (no prompt text in audit row) | `AiInteractionLog` | User + admin APIs |
| Error digests without PII | Sentry (redacted) | Ops |

**Controls:** `lib/security/audit-log.ts`, `lib/security/sentry.ts` (`beforeSend` redaction).

---

## T2 — PII

| Data | Storage | Encryption at rest | API exposure |
|------|---------|----------------------|--------------|
| `User.email`, `User.name`, `User.image` | Prisma `User` | DB TLS; not field-encrypted | Session JWT; admin lists **masked** unless `?includeSensitive=true` |
| Raw IP on audit rows | `AuditLog.ipAddress` | DB TLS | Admin security views |
| Hashed IP / UA | `UserSession.ipHash`, `userAgentHash` | N/A (one-way) | Never returned to client |
| Client email on invoices | `Client` model | DB TLS | Owner-only via `findOwnedFirst` |
| Feedback free text | `Feedback` | DB TLS | Admin analytics (aggregate preferred) |

**Controls:**

- Admin PII: `lib/api/admin-pii.ts` (`maskEmail`), audit `admin.view_sensitive`
- Logs/Sentry: `lib/security/redact.ts`
- IDOR: `lib/db/owned.ts`

---

## T3 — Financial

| Data | Storage | Encryption | Notes |
|------|---------|------------|-------|
| Invoices, quotes, line items | Prisma | DB TLS | All routes must use `ownedWhere` / `findOwnedFirst` |
| Income / expenses / ledger | Prisma | DB TLS | `auditFinancialEvent` on mutations |
| `BankConnection` (metadata) | Prisma | DB TLS | Public API shape: `lib/db/bank-connection.ts` |
| Plaid account numbers (if stored) | Prisma | Treat as T3+ | Never log full numbers |
| Stripe PaymentIntent IDs | Prisma / Stripe | — | Webhooks authoritative for paid status |
| Chat content (Money Mentor) | `ChatMessage` | Optional AES-GCM (`ENCRYPT_CHAT_CONTENT`) | AI privacy: see `AI_PRIVACY_CONTROLS.md` |
| Onboarding sensitive JSON | `UserOnboardingData` | Optional (`ENCRYPT_ONBOARDING_SENSITIVE`) | Packed via `lib/security/onboarding-sensitive.ts` |

**Controls:**

- `scripts/check-financial-owned-queries.mjs`
- `GET /api/invoices/verify-payment` is **read-only** (no status mutation from client)
- Plaid exchange responses omit `accessTokenEncrypted`

---

## T4 — Secrets & credentials

| Secret | Env var / location | Rotation | Never |
|--------|-------------------|----------|-------|
| Plaid access token | `BankConnection.accessTokenEncrypted` | AES-256-GCM via `BANK_TOKEN_ENCRYPTION_KEY` | Log, Sentry, client JSON |
| TOTP seed | `User.twoFactorSecret` | Same key material | Client, logs |
| NextAuth session | HTTP-only cookie | `NEXTAUTH_SECRET` rotation → re-login | `NEXT_PUBLIC_*` |
| Stripe / Plaid API keys | Server env only | Provider dashboard | Client bundle |
| Webhook signing secrets | Env | Provider dashboard | Git, client |
| Supabase service role | Server env only | Supabase dashboard | Client |

**Production requirement:** `BANK_TOKEN_ENCRYPTION_KEY` (32+ chars) — enforced in `lib/security/encryption.ts` and `instrumentation.ts`.

**Dev only:** fallback to `NEXTAUTH_SECRET` when bank key unset (non-production).

---

## Processing & third parties

| Processor | Data tiers | Purpose | DPA / notes |
|-----------|------------|---------|-------------|
| Supabase | T2 (Auth), T3 if using Data API | Auth SSR, optional realtime | Configure RLS; Prisma is app source of truth for business data |
| Stripe | T3, T4 | Payments, Connect | Webhook signature required |
| Plaid | T3, T4 | Bank link | Tokens encrypted at rest |
| Upstash | T1 | Rate limits | IP hashed in breadcrumbs only |
| Sentry | T1–T2 (redacted) | Errors/traces | `sentryBeforeSend` + Replay masking |
| LLM providers (optional) | T2–T3 when enabled | AI features | Consent required; prompts guarded |

---

## Dual-store architecture (Supabase + Prisma)

| Concern | Source of truth | Supabase role |
|---------|-----------------|----------------|
| Business/financial rows | **Prisma → Postgres** | Optional RLS for direct client queries |
| Audit trail | **Prisma `AuditLog`** | Legacy `security_audit_log` deprecated for server writes |
| API authentication | **NextAuth JWT** | Cookie sync / SSR only |
| Admin authorization | **Prisma role + MFA** | Not client-only |

---

## Retention (defaults)

| Category | Retention | Deletion path |
|----------|-----------|---------------|
| `AuditLog` | Indefinite (append-only) | Legal hold / future archival job |
| `ChatMessage` (AI memory) | Until user clears | `DELETE /api/ai/memory`, Money Mentor clear |
| `UserSession` | Active + revoked rows | Admin revoke, session limit (5) |
| `ErrorLog` | ~15 days in admin UI query | DB retention policy TBD |
| Sentry issues | Per Sentry project settings | Sentry dashboard |

---

## Developer checklist (per feature)

1. Assign tier(s) for new fields.
2. If T3+: use `findOwnedFirst` / Zod body schemas (never trust `userId` from body).
3. If T4: encrypt with `lib/security/encryption.ts`; never return ciphertext to client.
4. Log with `logSafeError` / `redactValue`; no raw Plaid/Stripe payloads.
5. Admin reads of T2: default mask; `includeSensitive` + audit.
6. Update this doc if introducing a new category or processor.

---

## Related documents

- [SECURITY_IMPLEMENTATION_PLAN.md](./SECURITY_IMPLEMENTATION_PLAN.md)
- [AI_PRIVACY_CONTROLS.md](./AI_PRIVACY_CONTROLS.md)
- [SECURITY_RELEASE_CHECKLIST.md](./SECURITY_RELEASE_CHECKLIST.md)
- [SECURITY_INCIDENT_RESPONSE.md](./SECURITY_INCIDENT_RESPONSE.md)
