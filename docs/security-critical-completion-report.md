# StackZen — Security Critical Work Completion Report

**Date:** 2026-04-30  
**Status:** Phase 2 product work **not** started; this report closes the **pre-beta security hardening** slice requested alongside `docs/security-critical-audit.md`.

---

## Validation commands

| Command | Result |
| --- | --- |
| `npx prisma validate` | **Pass** — `prisma/schema.prisma` valid. |
| `npx eslint <security-touched file list>` | **Pass** (exit 0) on the files changed in this security pass (see below). |
| `npx eslint app/api lib/api lib/auth.ts lib/env.ts --max-warnings 0` | **Not clean** — fails on **pre-existing** issues elsewhere under `app/api` (e.g. `auth/[...nextauth]`, `financial-mentorship`, `gigs/filters`, unused vars, Prettier). Remediation is a separate hygiene PR. |
| `npx tsc --noEmit` | **Fails** — large backlog unrelated to this change set (examples: `components/dev/TemplateAnalytics.tsx` JSX, `__mocks__/*`, `__tests__/api/gigs.test.ts`, various `_prisma` typos in components). **No new errors were introduced in the security-touched file set** after fixing `lib/api/require-admin.ts` JSON typing. |

---

## Routes audited

- **130** `app/api/**/route.ts` modules inventoried and classified in `docs/security-critical-audit.md` (table + methodology + residual risk section).

---

## Routes / modules fixed or added (this pass)

| Area | Change |
| --- | --- |
| **Stripe webhook** | `app/api/webhooks/stripe/route.ts` — `await req.text()`, `stripe-signature` header, `constructEvent`, Prisma updates with `{ id, userId }` from validated metadata; generic client errors. |
| **Savings goals** | `app/api/savings-goals/route.ts` — `requireAuthSession`, session-scoped queries, Zod `.strict()` POST, removed client-trusted `userId`. |
| **Card transactions API** | `app/api/transactions/route.ts` — NextAuth + Prisma (removed Supabase-only auth mismatch). |
| **Card stats** | `app/api/cards/stats/route.ts` — requires auth; no anonymous mock exposure. |
| **Invoice Checkout** | `app/api/invoices/create-payment-intent/route.ts` — `requireAuthSession`, Zod, rate limit, `findFirst` with `userId`, 403 for missing invoice, generic errors, `getURL()` for redirects. |
| **Bank / Plaid** | `lib/bank/plaid.ts` — working Plaid client export; `link-token` auth + rate limit + env gate; **`exchange-token`** persists encrypted tokens + accounts (**Prisma**); `transactions` reads stored connections when configured. |
| **User logo** | `app/api/user/upload-logo/route.ts` — `requireAuthSession`, writes under `public/uploads`, updates `User.image` via Prisma, size/type checks, no Drizzle. |
| **Signup** | `app/api/auth/signup/route.ts` — correct imports, Zod strict validation, bcrypt, **`lib/stripe/actions.ts` rewritten** so checkout creation type-checks; rate limit (`auth_signup`, strict in prod without Redis). |
| **Cron** | `app/api/cron/cleanup/route.ts`, `update-trials/route.ts` — fixed broken variables, bearer check includes missing secret, GET trial probe no longer leaks user IDs without secret. |
| **Admin users** | `app/api/admin/users/route.ts` — `requireAdminSession` (roles `ADMIN` \| `SUPER_ADMIN`), Prisma-aligned selects, removed `ioredis` dependency for listing (optional failed-attempt read via `_RedisEdge`), Zod on PATCH, **audit log** on subscription change, 403 without existence leak for unknown target id. |
| **AI mentor** | `app/api/money-mentor/route.ts` — fixed broken constants / return types, Zod POST, rate limit, generic errors. |
| **Feedback** | `app/api/feedback/route.ts` — rate limit; Zod failures no longer return raw `details`. |
| **Rate limiter** | `lib/auth/rate-limit.ts` — **bug fix** so Upstash `_RedisEdge` is actually used. |
| **API rate limit helper** | `lib/api/rate-limit-request.ts` — IP extraction, strict vs non-strict buckets. |
| **Admin guard + audit** | `lib/api/require-admin.ts` — `requireAdminSession`, `logAdminAudit` with Prisma `InputJsonValue`. |
| **Env** | `lib/env.ts` — Zod-based server env validation + helpers (`isPlaidConfigured`, `isUpstashRedisConfigured`). |
| **Instrumentation** | `instrumentation.ts` — calls `assertCoreServerEnv()` on startup. |

---

## Intentionally public routes

- `app/api/auth/[...nextauth]/**` — framework handler.  
- `app/api/auth/signup` — registration (rate-limited; Zod validated).  
- `app/api/auth/request-reset`, `reset-password` — **implemented** (Supabase recovery + Prisma token path); keep rate limits and env (Resend / Supabase) in mind for production.  
- `app/api/webhooks/stripe` — **Stripe-signature only** (no session).  

---

## Stripe webhook verification status

| Check | Status |
| --- | --- |
| Raw body | **Yes** — `req.text()` before any JSON parse. |
| Signature header | **Required** — missing → 400. |
| `STRIPE_WEBHOOK_SECRET` | **Required** at runtime for handler; env validator warns in production if unset. |
| `constructEvent` | **Yes** |
| Invoice ownership | **Yes** — `findFirst` / `update` with `{ id, userId }` from metadata. |
| Idempotency store | **No Prisma model** — document as **beta blocker** (Stripe may retry events). |

---

## API authentication coverage status

- **Improved** on all modules listed in “fixed” above.  
- **Middleware does not protect `/api/*`** — every sensitive route must keep or add `requireAuthSession` (or valid NextAuth session check).  
- **~100+** remaining routes already contained `getServerSession` / `requireAuthSession` per static grep but were **not** each re-audited line-by-line in this pass — see audit **NEEDS_REVIEW** / **NEEDS_FIX** clusters.

---

## Object ownership enforcement status

- **Strong** for: savings goals (this pass), invoice payment session creation (this pass), Stripe webhook invoice updates (this pass), admin user PATCH target lookup.  
- **Outstanding:** nested invoice PDF download (Drizzle), many CRUD routes under `expenses`, `income`, `clients`, `services`, gig aggregates, etc. — require systematic grep for `findUnique`/`update` without `userId` in `where`.

---

## Rate limiting status

| Status | Detail |
| --- | --- |
| **Core limiter** | Fixed and functional when Upstash env is set. |
| **Applied** | Signup (strict in prod), invoice payment session, Plaid routes, money-mentor POST, feedback POST. |
| **Gap** | NextAuth credential sign-in lives in `[...nextauth]` — rate limiting belongs in provider / custom adapter or edge middleware in front of `/api/auth/callback/*` (not changed here). |

---

## Environment validation status

- **`lib/env.ts`** shipped with documented required/optional keys.  
- **`assertCoreServerEnv`** runs from `instrumentation.ts` — production deploys with invalid core env will fail fast.

---

## Beta launch blockers (must fix before beta)

1. **Stripe webhook idempotency** — persist `event.id` and skip duplicates.  
2. **Plaid token storage** — Prisma model + encryption at rest + never return access tokens to clients; complete `exchange-token` + `transactions` flows.  
3. **Systematic API audit** — every `app/api/**` mutating handler: Zod `.strict()`, session `userId`, composite `where`, safe error JSON.  
4. **Remove or lock down** `app/api/debug/**`, `app/api/test/**`, `sentry-example-api` in production.  
5. **Invoice PDF download** — migrate off Drizzle; align with Prisma `Invoice` + `requireAuthSession`.  
6. **Clean `tsc` + full-tree `eslint app/api`** — currently blocked by unrelated tech debt (documented above).  

---

## Sign-off

Security-critical **audit document** and **this completion report** are in place. **Do not start Phase 2** until beta blockers above are triaged and owned.
