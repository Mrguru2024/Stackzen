# StackZen Security Audit Report

**Audit date:** 2026-05-16  
**Auditor role:** Production fintech security engineering review (Phase 1 — read-only)  
**Scope:** Full repository static analysis, cross-referenced with project security docs and prior `docs/security-critical-audit.md` (2026-04-30)  
**Implementation status:** No code changes in this phase — findings and plan only.

---

## Executive summary

StackZen is a Next.js 16 App Router fintech application with **Prisma + PostgreSQL (Supabase-hosted)**, **NextAuth (JWT) as the primary API auth layer**, **Supabase Auth as a secondary/password-sync path**, and substantial integrations (**Stripe**, **Plaid**, **Sentry**, **Upstash Redis**). A prior security-critical pass (April 2026) hardened high-risk routes (Stripe webhook, savings goals IDOR, signup, Plaid token storage, admin users). **Significant gaps remain** for bank-grade posture: API routes are **not protected at the edge**, security utilities are **fragmented and partially unwired**, AI privacy controls are **incomplete in schema and enforcement**, **Turnstile is undocumented-only**, and **automated security tests are absent**.

| Area | Maturity | Risk |
|------|----------|------|
| Auth (NextAuth + Supabase) | Medium | Dual-session confusion; 2FA schema incomplete |
| Edge protection (`proxy.ts`) | Medium–Low for pages / **Low for APIs** | All `/api/*` bypass JWT at proxy |
| API per-route auth | Medium | ~90+ routes use session helpers; ~212 total; uneven Zod/ownership |
| RBAC / Admin | Medium | Server guards on admin APIs; client `RoleGuard` case mismatch |
| Rate limiting | Low–Medium | Upstash helper exists; narrow coverage; duplicate limiters |
| Encryption | Medium | Plaid tokens encrypted; dev fallback key; limited field coverage |
| Audit logging | Low–Medium | Prisma `AuditLog` + admin helper; duplicate Supabase path |
| AI safety / privacy | Low | Mock mentor API; no schema for consent fields used in UI tests |
| Bot protection (Turnstile) | None | Not implemented |
| Security tests | None | No dedicated auth/IDOR/rate-limit/encryption tests |
| Security headers | Medium | `next.config.js` global headers; permissive CSP in all envs |

---

## Reference documents reviewed

| Document | Path | Notes |
|----------|------|-------|
| Security & Data Protection Plan | `docs/Security/Security and data plan.md` | Strategic; mentions Drizzle/crypto-js — **partially outdated** vs codebase |
| Prisma + Supabase + Sentry guide | `docs/Database/stackzen-prisma-supabase-sentry-guide.md` | Aligns with Prisma-primary stack |
| StackZen Requirements | `docs/Business requirements/StackZen Launch Tracker Sheet.md` | Product scope |
| AI / guardrails | `docs/Security/stackzen_guardrails_phase1_phase2_cleaned.md` | Drizzle examples; guardrails implemented via Prisma elsewhere |
| Final MVP Checklist | `docs/Build/StackZen_Final_MVP_Checklist_Reloaded.md` | Marks many security features “done” at product level — **not all enforced in code** |
| Prior API security audit | `docs/security-critical-audit.md` | 130-route inventory; still largely accurate for methodology |
| Prior completion report | `docs/security-critical-completion-report.md` | Lists April 2026 fixes |

**Not found in repo (referenced in user brief):** dedicated “AI Compliance & Algorithm Design” and “StackZen SDLC” filenames. Closest matches: guardrails doc, MVP checklist, `docs/Configs/cursor-ai-instructional.md`.

---

## 1. Authentication provider and active auth flow

### Primary: NextAuth (JWT session strategy)

- **Config:** `lib/auth-config.ts` — `PrismaAdapter`, providers: Google, Email (SMTP), Credentials (bcrypt + optional Supabase sign-in fallback).
- **API entry:** `app/api/auth/[...nextauth]/route.ts`
- **Session guard:** `lib/api/require-auth.ts` → `getServerSession(authOptions)`; returns JSON 401.
- **Client:** `SessionProvider` in `components/providers/AppProviders.tsx`.

### Secondary: Supabase Auth

- **SSR refresh:** `lib/supabase/middleware.ts` — `updateSession()` called from root `proxy.ts` on every matched request.
- **Client context:** `components/auth-provider.tsx` — `supabase.auth.getSession()` + `onAuthStateChange` (parallel to NextAuth).
- **User linkage:** `User.authUserId` (UUID) in Prisma for Supabase RLS alignment when using Data API.

### Active login/signup flows

| Flow | Path | Notes |
|------|------|-------|
| Credentials sign-in | NextAuth Credentials → `lib/auth-config.ts` | Prisma bcrypt first; Supabase fallback to sync password |
| Sign-up | `app/api/auth/signup/route.ts` | bcrypt-only in Prisma; Zod strict; Upstash rate limit (`auth_signup`, strict in prod) |
| Password reset | `app/api/auth/request-reset`, `reset-password` | Rate limited; Resend/Supabase per env |
| OAuth | Google via NextAuth | |
| Magic link | Email provider | |
| Post-login | `app/api/auth/post-login/route.ts` | Session-side effects |
| 2FA | `app/api/auth/2fa/*` (setup, verify, disable) | `SecurityService` in `lib/auth/security.ts`; **`twoFactorSecret` not in Prisma schema** (written via `as any`) |

### Gaps

- **Dual auth state** (NextAuth JWT + Supabase cookies) without a single documented source of truth for API authorization.
- **Credential brute-force:** rate limiting not applied inside NextAuth credential provider (noted in prior completion report).
- **MFA:** `User.twoFactorEnabled` exists; no `mfaRequired` for admins, no passkeys/WebAuthn implementation (deps exist transitively only).
- **Session revocation table:** no Prisma model; Redis keys in `SessionService` / admin device APIs only.

---

## 2. Active ORM: Prisma vs Drizzle

| ORM | Status | Evidence |
|-----|--------|----------|
| **Prisma 6.19.3** | **Active — primary** | `prisma/schema.prisma`, `lib/prisma.ts`, all financial models, migrations under `prisma/migrations/` |
| **Drizzle** | **Legacy / minimal** | `drizzle-orm` in `package.json`; used in `lib/db.ts`, `lib/db/schema.ts`, `app/api/performance/route.ts`, invoice download route (per prior audit) |

**Recommendation:** Treat Prisma as sole ORM for security work; migrate remaining Drizzle routes before adding new security migrations.

---

## 3. Middleware / proxy (edge protection)

### Root: `proxy.ts` (Next.js 16 — replaces `middleware.ts`)

| Behavior | Detail |
|----------|--------|
| Supabase cookies | `updateSession(request)` on all matched paths |
| **API bypass** | Lines 23–32: paths starting with `/api/` return immediately — **no JWT, no rate limit, no role checks** |
| Public pages | `/`, `/pricing`, `/login`, `/register`, auth paths, Stripe connect return URLs, etc. |
| Protected pages | `getToken({ secret: NEXTAUTH_SECRET })`; redirect to `/login` if missing |
| Trial | `middleware/trial-check.ts` after auth |
| Unused imports | `RateLimiter`, `IPBlocker` instantiated at module level but **not invoked** in `proxy()` |

### Orphaned: `middleware/security.ts`

- Defines `securityMiddleware` with ioredis IP block, rate limit, session cookie check, security headers.
- **Not imported by `proxy.ts`** — dead code path; TypeScript error backlog in `.cursor-tsc-errors.txt`.
- CSP here is stricter than production `next.config.js` but never applied.

### Implication

**All API security must be enforced per route handler** (or a shared wrapper). This matches prior audit but remains the single largest architectural gap for fintech API exposure.

---

## 4. API route protection

**Inventory:** 212 `app/api/**/route.ts` files (count 2026-05-16).

### Shared guards

| Module | Purpose |
|--------|---------|
| `lib/api/require-auth.ts` | `requireAuthSession()` — standard JSON 401 |
| `lib/api/require-admin.ts` | `requireAdminSession()` — ADMIN \| SUPER_ADMIN \| privileged email; `logAdminAudit()` |
| `lib/api/production-gate.ts` | `notFoundInProduction()` for debug routes |

### Coverage (static grep — approximate)

- **~90+ route modules** reference `getServerSession` or `requireAuthSession` / `requireAdminSession`.
- **All 13 `app/api/admin/**` routes** use `requireAdminSession` (verified).
- **Public by design:** `app/api/auth/[...nextauth]`, signup, reset, `app/api/webhooks/stripe`, `app/api/plaid/webhook`, cron routes (Bearer `CRON_SECRET`).
- **Cron:** `app/api/cron/cleanup/route.ts` — Bearer check present.

### High-risk clusters (prior audit + spot checks)

| Cluster | Auth pattern | Concern |
|---------|--------------|---------|
| `income/**`, `expenses/**`, `clients/**` | Mostly session-scoped | Per-handler Zod + `userId` in `where` not verified line-by-line |
| `invoices/**` | Mixed; several hardened | Nested download route still Drizzle/broken session (prior NEEDS_FIX) |
| `aggregated-gigs/**`, `gigs/**` | Mixed public/catalog vs user | NEEDS_REVIEW |
| `ai-recommendations` | Auth only outside development | **Dev bypass exposes mock investment advice without auth** |
| `money-mentor` | Auth + Zod + rate limit | Rule-based mock responses; stores interaction context in handler memory only |
| `debug/**` | SUPER_ADMIN + `notFoundInProduction` | Good prod gate; dev still exposes diagnostics |
| `test/**`, `sentry-example-api` | Varies | Must stay disabled in production |

### Stripe / Plaid routes

| Route | Protection |
|-------|------------|
| `app/api/webhooks/stripe/route.ts` | Signature + raw body; metadata `invoiceId`/`userId`; **`StripeEvent` idempotency** (schema present; handler uses `prisma.stripeEvent`) |
| `app/api/plaid/webhook/route.ts` | Optional verification header + HMAC signing secret |
| `app/api/plaid/link-token`, `exchange-token` | `requireAuthSession` + rate limits |
| `app/api/bank/*` | Same pattern (legacy path alias for Plaid) |
| `app/api/stripe/connect/**` | Session auth + partial rate limits |

---

## 5. RBAC logic

### Data model

```prisma
enum UserRole {
  USER
  ADMIN
  PRO
  SUPER_ADMIN
}
```

### Enforcement points

| Layer | Implementation | Server-side? |
|-------|----------------|--------------|
| API admin | `requireAdminSession()` | Yes |
| Privileged email | `lib/auth/privileged-users.ts` → elevates to SUPER_ADMIN in admin guard | Yes |
| Page admin | `app/admin/dashboard/page.tsx` — `getServerSession()` + `RoleGuard allowedRoles={['admin']}` | **Partial — client guard only**; role enum is `ADMIN` not `admin` |
| Mentor | `app/api/mentor/dashboard/route.ts`, mentor routes | Session + mentor relation (verify per route) |

### Gaps

- No proxy-level `/admin/*` role enforcement.
- No MFA requirement for admin roles.
- `PRO` role semantics not centralized in guards.

---

## 6. Admin routes

### UI

| Path | Protection |
|------|------------|
| `app/admin/dashboard/page.tsx` | Server session redirect + `RoleGuard` (client) |
| `app/(dashboard)/admin/feedback/page.tsx` | Dashboard layout (proxy JWT) |
| `app/(dashboard)/admin/mentors/page.tsx` | Dashboard layout |

### API (`app/api/admin/**`)

All 13 routes use `requireAdminSession`: users, mentors, audit-logs, devices, security-events, error-logs, system-health, sentry-reports, vercel-deployments, feedback-analysis, bank-sync-jobs/replay.

### UI components

- `components/admin/AdminDashboard.tsx`, `AuditLogs.tsx`, `SecurityMetrics.tsx`, `SuperAdminDiagnostics.tsx`

---

## 7. Logging and audit system

### Prisma `AuditLog`

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String
  severity  String   @default("info")
  details   Json?
  ipAddress String?
  resource  String?
  ...
}
```

**Writers today:**

- `logAdminAudit()` in `lib/api/require-admin.ts` (admin actions).
- `SessionService` in `lib/auth/session.ts` (`SESSION_CREATED`, etc.).
- Ad hoc creates in various flows (not centralized).

**Reader:** `app/api/admin/audit-logs/route.ts` (admin-only, CSV export).

### Parallel / conflicting: `lib/auth/security-audit.ts`

- Uses **Supabase client** (`createClient()`) → table `security_audit_log`.
- Suitable for browser-side patterns; **must not be the canonical server audit path** for fintech compliance.
- Risk: split brain between Postgres (Prisma) and Supabase table existence/RLS.

### Application logging

- `lib/monitoring.ts`, Sentry configs (`sentry.server.config.ts`, `sentry.edge.config.ts`, `sentry.client.config.ts`).
- **No dedicated `lib/security/redact.ts`** for tokens, PAN, Plaid access tokens, or full webhook bodies.

---

## 8. Stripe and Plaid integration security

### Stripe

- Webhook: verified, idempotent via `StripeEvent` model (updated since April audit).
- Connect routes: user-scoped session; rate limit on onboard.
- Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` validated in `lib/env.ts` (warn if missing in prod).

### Plaid

- Tokens: `BankConnection.accessTokenEncrypted` + `accessTokenLast4`; encryption via `lib/security/encryption.ts`.
- Webhook: signature / verification key support in `app/api/plaid/webhook/route.ts`.
- Env: `PLAID_*`, `BANK_TOKEN_ENCRYPTION_KEY` (optional; falls back to `NEXTAUTH_SECRET`).

### Residual risks

- Encryption fallback to `NEXTAUTH_SECRET` or hardcoded dev string in `encryption.ts` if `BANK_TOKEN_ENCRYPTION_KEY` unset.
- Plaid/webhook rate limiting not applied (public endpoint — rely on signature + WAF).
- Legacy `lib/stripe.ts` helpers flagged in prior audit — verify before use.

---

## 9. AI memory and Zen data storage

| Asset | Storage | Protection |
|-------|---------|------------|
| Chat / mentor turns | `ChatMessage` (Prisma) — `content` plaintext | Auth on `money-mentor`; no encryption |
| AI recommendations | Static JSON in `app/api/ai-recommendations/route.ts` | Mock data; auth skipped in development |
| Personalization UI | `components/ai-personalization/` | Tests mock `aiMemoryEnabled`, `aiOptOut`, `aiUsageLog` — **fields not in `User` / `UserSettings` schema** |
| Onboarding AI tone | `UserOnboardingData` | Exists; consent flags not unified |
| FinGPT | `lib/ai/fingpt.ts` | Verify callers and data sent to external LLM |

**Gaps vs product requirements:**

- No enforced AI consent gate before persistence.
- No memory deletion API tied to schema.
- No prompt-injection guard utility.
- No phrase-level “non-directive financial language” enforcer beyond `RESTRICTED_TOPICS` substring check in `money-mentor`.

---

## 10. Environment variables

**Validated server-side:** `lib/env.ts` (Zod) — `NEXTAUTH_SECRET`, `DATABASE_URL`, optional Stripe, Plaid, Upstash, Supabase public keys, `CRON_SECRET`.

**Documented:** `.env.example` — Redis, Upstash, Plaid, Stripe, Sentry, security header flags (`SECURITY_HEADERS_ENABLED`, etc.) — **flags not wired to conditional header logic in `next.config.js`**.

**Missing from validation (should be added in implementation):**

- `BANK_TOKEN_ENCRYPTION_KEY`
- `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (not present)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; not in Zod schema)

**Startup:** `assertCoreServerEnv()` referenced in prior completion report for `instrumentation.ts` — **root `instrumentation.ts` not present** (only `instrumentation-client.ts` / `app/instrumentation-client.ts`). Fail-fast env check may not run on server boot.

---

## 11. Security headers

**Source:** `next.config.js` `headers()` for `/:path*`

| Header | Present | Notes |
|--------|---------|-------|
| HSTS | Yes | `max-age=63072000; includeSubDomains; preload` — applies in all NODE_ENV |
| X-Frame-Options | DENY | |
| X-Content-Type-Options | nosniff | |
| Referrer-Policy | origin-when-cross-origin | |
| CSP | Weak | `default-src 'self' 'unsafe-inline' 'unsafe-eval' https: wss: data: blob:` — comment says “temporarily disable CSP for development” but applies globally |
| Permissions-Policy | Partial | `interest-cohort=()` only |
| API Cache-Control | no-store | Good for `/api/*` |

**CORS:** `lib/cors.ts` — allowlist for stackzen.com + `NEXT_PUBLIC_APP_URL`; **not integrated into `proxy.ts`**.

---

## 12. Rate limiting

| Implementation | Location | Wired? |
|----------------|----------|--------|
| Upstash `RateLimiter` | `lib/auth/rate-limit.ts` + `lib/api/rate-limit-request.ts` | Used on ~14 routes |
| In-memory Map | `lib/rate-limit.ts` | Standalone; not edge-wide |
| ioredis in `SecurityService` | `lib/auth/security.ts` | Separate from Upstash |
| IP blocker | `lib/auth/ip-blocker.ts` | Imported in `proxy.ts` but unused |
| `middleware/security.ts` | ioredis | Orphaned |

**Buckets in use:** `auth_signup`, `auth_password_reset_*`, `plaid_*`, `ai_money_mentor`, `feedback_submit`, `invoice_payment_*`, `stripe_connect_onboard`, `plaid_sync` (strict).

**Gaps:** login, generic `/api/financial/*`, admin APIs, AI chat beyond money-mentor, Plaid/Stripe webhooks (signature-only).

---

## 13. Input validation (Zod)

- **Present** on many mutating routes (~50 files with `zod` / `z.object` in `app/api`).
- **Pattern:** `requireAuthSession` + parse body — inconsistent `.strict()` usage.
- **Anti-pattern:** prior IDOR on `savings-goals` (fixed) — grep still needed for `userId` from `req.json()` on other routes.

---

## 14. Test coverage (security-relevant)

| Framework | Jest (`npm test`) |
|-----------|-------------------|
| Security-specific tests | **None** |
| Related | `components/ai-personalization/AiPersonalization.test.tsx` (UI mocks only); `__tests__/api/stripe-connect.test.ts`, gigs tests |
| lib tests | Operational/financial automation only (36 files under `lib/**/__tests__`) |

---

## 15. Duplicate or conflicting security utilities

| Concern | Files | Recommendation |
|---------|-------|----------------|
| Rate limiting | `lib/auth/rate-limit.ts`, `lib/rate-limit.ts`, `lib/auth/security.ts`, `middleware/security.ts` | Consolidate on Upstash + `enforceApiRateLimit`; delete or deprecate others |
| Audit logging | Prisma `AuditLog` + `logAdminAudit` vs `lib/auth/security-audit.ts` (Supabase) | Single server module `lib/security/audit-log.ts` → Prisma only |
| Session tracking | NextAuth `Session` model vs Redis `SessionService` vs `session_id` cookie in orphaned middleware | Define one session story |
| Auth providers | NextAuth vs Supabase `AuthProvider` | Document API authority = NextAuth JWT |
| Encryption | `lib/security/encryption.ts` vs `SecurityService.encryptSecret` (private methods) | Unified crypto module, no `crypto-js` |
| Edge security | `proxy.ts` vs `middleware/security.ts` | Merge headers/rate limit into proxy or delete orphan |
| Drizzle vs Prisma | `lib/db.ts` vs `lib/prisma.ts` | Migrate stragglers |

---

## 16. OWASP / fintech alignment snapshot

| Risk | Status |
|------|--------|
| API1 Broken object level authorization | Partial — fixes on savings-goals, invoices; systematic review outstanding |
| API2 Broken authentication | Medium — per-route auth; APIs bypass proxy |
| API3 Broken object property level auth | Low coverage |
| API4 Unrestricted resource consumption | Low — limited rate limits |
| API5 Broken function level authorization | Admin routes improved |
| API8 Security misconfiguration | CSP weak; debug routes gated in prod |
| Sensitive data exposure | Plaid encrypted; logs not redacted |
| SSRF / injection | No centralized prompt-injection defense for AI |

---

## 17. Positive controls (existing)

- NextAuth + Prisma adapter with bcrypt cost 12 on signup.
- `requireAuthSession` / `requireAdminSession` shared guards.
- Stripe webhook signature verification + `StripeEvent` deduplication.
- Plaid token encryption at rest + webhook HMAC option.
- Upstash rate limiting helper with strict mode for signup/sync.
- `notFoundInProduction()` on debug diagnostics.
- Global security headers in `next.config.js` (baseline).
- `BankConnection` / financial models scoped by `userId` at schema level.
- Admin audit logging helper for subscription changes.
- April 2026 critical route fixes documented in `docs/security-critical-completion-report.md`.

---

## 18. Critical findings (prioritized)

1. **P0 — API edge bypass:** `proxy.ts` returns early for all `/api/*` without auth, rate limits, or security headers from `middleware/security.ts`.
2. **P0 — Incomplete 2FA schema:** `twoFactorSecret` written via `as any`; not durable or migratable.
3. **P1 — No Turnstile:** Bot protection for auth/AI/contact not implemented despite plan docs.
4. **P1 — Audit logging fragmentation:** Supabase `security_audit_log` vs Prisma `AuditLog` without single immutable pipeline.
5. **P1 — AI consent/memory:** UI/tests reference fields absent from Prisma; `ChatMessage` stores plaintext without opt-out enforcement.
6. **P1 — Encryption key fallback:** Production must require `BANK_TOKEN_ENCRYPTION_KEY`; remove dev fallback string for sensitive fields.
7. **P2 — Orphaned `middleware/security.ts`:** Creates false confidence; fails typecheck.
8. **P2 — `RoleGuard` role string mismatch:** `'admin'` vs `'ADMIN'`.
9. **P2 — `instrumentation.ts` missing:** `assertCoreServerEnv()` may not run at startup.
10. **P2 — No security test suite:** Regression risk on IDOR and auth guards.

---

## 19. Assumptions

- Production deploys use Next.js 16 `proxy.ts` convention (not legacy `middleware.ts`).
- Postgres RLS via Supabase is **not** the primary enforcement layer for App Router API routes (Prisma uses service role connection).
- Cloudflare WAF/Turnstile may exist at edge but are **not configured in this codebase**.
- Prior April audit route count (~130) has grown to **212** — rescale remediation estimates.

---

## 20. Document control

| Version | Date | Author |
|---------|------|--------|
| 1.0 | 2026-05-16 | Security audit (Phase 1) |

**Next step:** Implement per `SECURITY_IMPLEMENTATION_PLAN.md` (Phase 2+). Do not duplicate utilities listed in Section 15 — extend or wire existing modules first.
