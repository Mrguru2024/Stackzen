# Phase 2 — Security Foundation Implementation Log

**Completed:** 2026-05-16  
**Sources:** `SECURITY_AUDIT_REPORT.md`, `SECURITY_IMPLEMENTATION_PLAN.md`  
**Status:** Phase 2 foundation complete (ready for Phase 3).

---

## 1. Files created

| File | Purpose |
|------|---------|
| `lib/security/proxy-policy.ts` | Central route classification + rate-limit bucket mapping |
| `lib/security/security-headers.js` | CSP/HSTS/Permissions-Policy for `next.config.js` |
| `lib/security/turnstile.ts` | Cloudflare Turnstile server verification |
| `components/security/TurnstileWidget/index.tsx` | Client Turnstile widget |
| `lib/api/with-security.ts` | `withAuth`, `withAdmin`, `withZod`, `withRateLimit`, `composeHandlers` |
| `lib/validation/errors.ts` | Production-safe Zod error responses |
| `lib/validation/auth.ts` | Signup / reset Zod schemas |
| `lib/validation/expense.ts` | Expense create schema |
| `lib/validation/invoice.ts` | Quote / invoice schemas |
| `lib/validation/ai.ts` | Money mentor POST schema |
| `instrumentation.ts` | `assertCoreServerEnv()` on server boot |
| `app/admin/layout.tsx` | Server-side admin role gate |
| `middleware/security.ts` | **Deprecated stub** (replaces deleted orphan) |
| `lib/security/__tests__/proxy-policy.test.ts` | Route policy tests |
| `lib/security/__tests__/turnstile.test.ts` | Fail-closed production tests |
| `lib/security/__tests__/cors-origins.test.ts` | CORS allowlist tests |
| `lib/validation/__tests__/errors.test.ts` | Zod error redaction tests |
| `lib/api/__tests__/rate-limit-request.test.ts` | Strict bucket tests |

---

## 2. Files modified

| File | Change |
|------|--------|
| `proxy.ts` | Policy-driven API CORS, IP block, redirect validation (`callbackUrl`/`next`), edge rate limits, page JWT + admin gate |
| `next.config.js` | Uses `getGlobalSecurityHeaders()` — prod CSP, no global `unsafe-eval` in prod |
| `lib/cors.ts` | `ALLOWED_ORIGINS` env, no wildcard+credentials, `resetAllowedOriginsCache()` for tests |
| `lib/env.ts` | `CSP_REPORT_URI`, `SECURITY_STRICT_RATE_LIMIT`, `ALLOWED_ORIGINS`, Turnstile helpers |
| `lib/api/rate-limit-request.ts` | Standardized buckets + `isStrictRateLimitBucket()` |
| `lib/auth/rate-limit.ts` | Canonical Upstash limiter comment |
| `lib/rate-limit.ts` | **Deprecated** in-file notice |
| `.env.example` | New security env vars documented |
| `app/api/auth/signup/route.ts` | Shared `signupBodySchema` + Turnstile (proof route) |
| `app/api/auth/request-reset/route.ts` | `requestResetBodySchema`, bucket `auth_password_reset` |
| `app/api/auth/reset-password/route.ts` | Bucket `auth_password_reset` |
| `app/api/expenses/route.ts` | `expenseCreateSchema` + `zodErrorResponse` |
| `app/api/quotes/route.ts` | **Proof:** `withRateLimit` + `withAuth` + `withZod` |
| `app/api/money-mentor/route.ts` | **Proof:** `withRateLimit('ai_chat')` + `withAuth` + `withZod` |
| `components/auth/signup-form`, `signin-form`, `request-reset-form` | Turnstile widget (UI; server proof on signup) |
| `lib/auth-config.ts` | Optional Turnstile on credentials login when configured |
| `components/auth/RoleGuard.tsx` | Case-insensitive role matching |
| `app/admin/dashboard/page.tsx` | `ADMIN` / `SUPER_ADMIN` roles |

---

## 3. Security controls implemented

| Control | Implementation |
|---------|----------------|
| Global headers | `next.config.js` + `lib/security/security-headers.js` |
| Production CSP | Stripe, Plaid, Supabase, Sentry, Turnstile allowlisted; optional `CSP_REPORT_URI` |
| CORS | Allowlist-only; OPTIONS on `/api/*` via `proxy.ts` |
| Proxy policy | `lib/security/proxy-policy.ts` |
| Suspicious paths | Blocked at proxy (403) |
| Safe redirects | `callbackUrl` and `next` query params validated |
| Edge rate limits | `auth_*`, `admin_api`, `financial_write`, `ai_chat`, `webhook_*` |
| Strict rate limit | `SECURITY_STRICT_RATE_LIMIT` + production defaults → 503 without Upstash |
| Auth wrappers | `lib/api/with-security.ts` |
| Zod foundation | `lib/validation/*` + `zodErrorResponse` |
| Turnstile | Server verify on **signup** (proof); widget on signup/signin/reset forms |
| Admin server gate | `app/admin/layout.tsx` |
| Env validation | Extended `lib/env.ts` + `instrumentation.ts` |

---

## 4. Routes protected

### Pages (proxy JWT)

- Protected dashboard paths: `/dashboard`, `/mentor`, `/expenses`, `/income`, `/invoices`, `/quotes`, `/settings`, `/goals`, and related app routes
- Admin pages: `/admin/*` (role `ADMIN` | `SUPER_ADMIN`)
- Public: marketing, auth, Stripe return URLs (see `isPublicPath`)

### API (edge rate limit + handler auth)

| Group | Edge bucket | Handler auth |
|-------|-------------|--------------|
| `/api/admin/*` | `admin_api` | `requireAdminSession` |
| `/api/auth/signup` | `auth_signup` | Public + Turnstile |
| `/api/auth/*` POST (login) | `auth_login` | NextAuth |
| Password reset | `auth_password_reset` | Public + Zod |
| Financial writes | `financial_write` | `requireAuthSession` |
| `/api/money-mentor` POST | `ai_chat` | `withAuth` proof |
| `/api/webhooks/stripe` | `webhook_stripe` | Stripe signature |
| `/api/plaid/webhook` | `webhook_plaid` | Plaid verification |

**Note:** API routes do **not** use JWT at proxy (by design). Handlers must keep `requireAuthSession` / wrappers.

---

## 5. Tests added

| Test file | Coverage |
|-----------|----------|
| `lib/security/__tests__/proxy-policy.test.ts` | Classification, buckets, redirect safety |
| `lib/security/__tests__/turnstile.test.ts` | Production fail-closed without secret |
| `lib/security/__tests__/cors-origins.test.ts` | `ALLOWED_ORIGINS` parsing |
| `lib/validation/__tests__/errors.test.ts` | No raw Zod codes in response |
| `lib/api/__tests__/rate-limit-request.test.ts` | Strict bucket flag |

**Run:**

```bash
npx jest lib/security lib/validation/__tests__/errors.test.ts lib/api/__tests__/rate-limit-request.test.ts
```

---

## 6. Environment variables added

```env
CSP_ENABLED=true
CSP_REPORT_URI=
HSTS_ENABLED=true
SECURITY_STRICT_RATE_LIMIT=true
ALLOWED_ORIGINS=https://stackzen.com,https://www.stackzen.com
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

(Also documented: `BANK_TOKEN_ENCRYPTION_KEY` for Phase 4.)

---

## 7. Deprecated files

| File | Replacement |
|------|-------------|
| `middleware/security.ts` | `proxy.ts` + `lib/security/proxy-policy.ts` |
| `lib/rate-limit.ts` | `lib/api/rate-limit-request.ts` + `lib/auth/rate-limit.ts` |

---

## 8. Remaining Phase 2 / pre–Phase 3 items

- Apply `with-security` wrappers across remaining ~200 API routes (only 2 proof routes wired)
- Turnstile on login/reset at API layer (forms have widget; signup is server proof)
- Migrate `app/api/auth/*` reset flows to `lib/validation/auth.ts` entirely
- Full `npm test` suite has pre-existing failures unrelated to this pass
- `npm run typecheck:ci` may report backlog outside security-touched files
- Expenses POST uses shared schema but not `withRateLimit` wrapper yet (edge `financial_write` applies)

---

## 9. Risks and assumptions

- **Assumption:** NextAuth JWT remains API authority; Supabase only refreshes SSR cookies.
- **Risk:** Production CSP may require tuning when new third-party scripts are added.
- **Risk:** `getAllowedOrigins()` is cached at runtime — restart required after env changes.
- **Risk:** Turnstile fail-closed blocks signup in production until keys are set (intentional).

---

## 10. Commands to run

| Command | Available | Notes |
|---------|-----------|-------|
| `npx jest lib/security lib/validation/__tests__/errors.test.ts lib/api/__tests__/rate-limit-request.test.ts` | Yes | Phase 2 security tests |
| `npm run typecheck:ci` | Yes | Prisma generate + full `tsc` |
| `npm run typecheck` | Yes | Scoped `tsconfig.typecheck.json` |
| `npm test` | Yes | Full suite; many pre-existing failures |
| `npm run lint` | Yes | `next lint` |

**No Prisma migrations** in Phase 2 (foundation only).

---

## Phase 2 sign-off

Phase 2 foundation objectives from the implementation plan are satisfied. **Do not start Phase 3** until product review of this log and production env configuration (Upstash + Turnstile + `ALLOWED_ORIGINS`).
