# StackZen — Critical Security Audit (`app/api/**`)

**Date:** 2026-04-30  
**Scope:** Every `app/api/**/route.ts` handler (130 route modules), plus cross-cutting findings (Prisma vs Drizzle, Stripe, env, rate limits, logging).  
**Classifications:** `PUBLIC_SAFE` | `AUTH_REQUIRED` | `ADMIN_REQUIRED` | `STRIPE_WEBHOOK_ONLY` | `INTERNAL_CRON_ONLY` | `NEEDS_FIX`

## Executive summary

| Theme | Finding |
| --- | --- |
| API auth | Middleware explicitly bypasses `/api/*`; **per-route** `getServerSession` / `requireAuthSession` is mandatory for protected data. Many routes already used session helpers; several high-risk routes were unauthenticated or broken (see fixes in completion report). |
| Object-level auth | Patterns vary: best practice is `where: { id, userId: session.user.id }` and **403** for cross-tenant access without existence disclosure. Several historical routes trusted `userId` from JSON (e.g. savings goals) or used `findUnique({ where: { id } })` without `userId`. |
| Stripe webhook | `app/api/webhooks/stripe/route.ts` was non-functional (wrong imports/identifiers, `request.json()` risk, updates without ownership). **Rewritten** with raw body + `constructEvent`, metadata `invoiceId` + `userId` validation, Prisma `findFirst` + composite update. |
| Prisma vs Drizzle | `app/api/invoices/[invoiceId]/[id]/download/route.ts` and `app/api/user/upload-logo/route.ts` referenced Drizzle/`authOptions()` as session — misaligned with Prisma + NextAuth. Upload logo **migrated to Prisma** `User.image`. Invoice PDF download still **NEEDS_FIX** (Drizzle + broken session). |
| Stripe webhooks elsewhere | No `app/api/stripe/webhook/route.ts` in tree; Connect routes under `app/api/stripe/connect/**` are **AUTH_REQUIRED** (session), not webhooks. |
| Zod | Many POST routes lack `.strict()` Zod; critical financial POSTs partially covered in this pass (see completion report). |
| Raw errors | Several routes returned stack traces, Zod `details`, or Plaid/Stripe internals to clients; hardened on touched routes. |
| Sensitive logging | Avoid logging tokens, full webhook bodies, Plaid access tokens, passwords. Prefer structured server logs without PII/secrets. |
| Rate limiting | `lib/auth/rate-limit.ts` was **broken** (referenced `RedisEdge` / `key` / `blockKey` instead of `_RedisEdge` / `_key` / `_blockKey`). **Fixed.** Upstash optional: `lib/api/rate-limit-request.ts` documents strict vs non-strict behavior. |
| Env | **`lib/env.ts`** added: `NEXTAUTH_SECRET`, `DATABASE_URL`, optional `DIRECT_URL`, Stripe, Supabase public vars, Plaid, Upstash, `CRON_SECRET`. `instrumentation.ts` calls `assertCoreServerEnv()`. |
| Idempotency | **No** `ProcessedStripeEvent` (or similar) model in Prisma — webhook handlers may repeat work on Stripe retries (outcome is idempotent for invoice status only). **Beta blocker:** add deduplication table keyed by `event.id`. |

---

## OWASP alignment (high level)

| Control | Application here |
| --- | --- |
| API1 broken object auth | Enforce `userId` from session; composite `where` on mutations; 403 without leaking resource existence. |
| API2 broken auth | `requireAuthSession` / admin helper; no reliance on middleware for `/api`. |
| API3 broken prop / mass assignment | Zod `.strict()` on new/changed POST bodies where applied. |
| API4 unrestricted resource | Rate limits on signup, AI mentor, invoice payment session, Plaid, feedback. |
| API5 broken function | Stripe webhook signature verification; cron `CRON_SECRET`. |
| ASVS V2 | Passwords never logged; signup uses bcrypt only server-side. |
| ASVS V4 | Access control on admin (`ADMIN`, `SUPER_ADMIN`) + audit log on subscription PATCH. |

---

## Route inventory (130 × `route.ts`)

Legend: **Auth** = uses `requireAuthSession` or `getServerSession`+`authOptions`. **Fin** = invoices, quotes, payments, income/expenses, bank, cards, savings, goals, subscriptions, PII. **Zod** = structured validation on mutating methods. **Owner** = Prisma queries scoped by `userId` / tenant where applicable.

> Many routes share patterns with sibling files in the same folder. Rows marked **NEEDS_REVIEW** were not individually line-audited in this pass but are classified from path + quick static review.

| Path | Class | Auth | Fin | Owner | Zod | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `app/api/auth/[...nextauth]/route.ts` | PUBLIC_SAFE | N/A | N | N/A | N | NextAuth handler — do not wrap in `requireAuthSession`. |
| `app/api/auth/2fa/**` (5 routes) | AUTH_REQUIRED | Y | N | Y | Partial | Session + user scope; verify Zod on POST bodies. |
| `app/api/auth/post-login/route.ts` | AUTH_REQUIRED | Y | N | Y | Partial | |
| `app/api/auth/request-reset/route.ts` | PUBLIC_SAFE | N | N | N/A | Y (email) | **Implemented** — Prisma token + generic response; **`enforceApiRateLimit`** (`auth_password_reset_request`). |
| `app/api/auth/reset-password/route.ts` | PUBLIC_SAFE | N | N | N/A | Y | **Implemented** — strict Zod body + bcrypt; **`enforceApiRateLimit`** (`auth_password_reset_complete`). |
| `app/api/auth/signup/route.ts` | PUBLIC_SAFE | N | Y | N/A | Y | Public; **strict signup Zod + Upstash rate limit (strict in prod)**. |
| `app/api/auth/verify-email/route.ts` | PUBLIC_SAFE / AUTH | varies | N | N/A | Partial | Verify implementation uses signed token, not guessable ids. |
| `app/api/webhooks/stripe/route.ts` | STRIPE_WEBHOOK_ONLY | Signature | Y | Y | N/A | **Rewritten** — raw body, `constructEvent`, metadata `invoiceId`+`userId`. |
| `app/api/cron/cleanup/route.ts` | INTERNAL_CRON_ONLY | Bearer | N | N/A | N | **Fixed** variable bugs + safe JSON errors. |
| `app/api/cron/update-trials/route.ts` | INTERNAL_CRON_ONLY | Bearer | N | N/A | N | **GET secured** with same bearer; no user id list in body. |
| `app/api/admin/**` (11 routes) | ADMIN_REQUIRED | Mixed | Y | Mixed | Partial | **`admin/users` fixed** — `requireAdminSession`, Prisma role enum, audit on PATCH. Others still **NEEDS_FIX** until wired to `requireAdminSession` + audit. |
| `app/api/invoices/**` | AUTH_REQUIRED | Y | Y | Partial→Y | Partial | Several routes hardened in prior + this pass; nested `[id]/download` **NEEDS_FIX** (Drizzle). |
| `app/api/quotes/route.ts` | AUTH_REQUIRED | Y | Y | Verify | Partial | Confirm all methods use session `userId`. |
| `app/api/expenses/**`, `app/api/expense/summary` | AUTH_REQUIRED | Y | Y | Verify | Partial | High priority for strict Zod + owner on PATCH/DELETE. |
| `app/api/income/**` | AUTH_REQUIRED | Y | Y | Verify | Partial | |
| `app/api/bank/link-token` | AUTH_REQUIRED | Y | Y | N/A | N | **Rate limit + Plaid env gate + fixed Plaid client.** |
| `app/api/bank/exchange-token` | AUTH_REQUIRED | Y | Y | N/A | Y | **Implemented** — encrypts & persists `BankConnection` + `BankAccount` rows, emits `BANK_CONNECTED` (see `app/api/bank/exchange-token/route.ts`). |
| `app/api/bank/transactions` | AUTH_REQUIRED | Y | Y | Y | N | Returns **`FinancialTransaction`** rows for **`PLAID_SYNC`** (requires prior sync / ingestion). |
| `app/api/cards/stats` | AUTH_REQUIRED | Y | Y | N/A | N | **Auth added**; placeholder stats. |
| `app/api/transactions` | AUTH_REQUIRED | Y | Y | Y | N | **Migrated from Supabase cookie to NextAuth + Prisma.** |
| `app/api/savings-goals` | AUTH_REQUIRED | Y | Y | Y | Y | **Critical IDOR fixed** — was global `findMany` + client `userId`. |
| `app/api/savings-accounts`, `savings-challenges/**` | AUTH_REQUIRED / NEEDS_FIX | varies | Y | Verify | Partial | `savings-accounts/route.ts` nearly empty — **NEEDS_FIX**. |
| `app/api/goals/progress`, `wellness/**`, `smart-saving/**` | AUTH_REQUIRED | Y | Y | Verify | Partial | |
| `app/api/user/**` | AUTH_REQUIRED | Mixed | Y | Y | Partial | **`upload-logo` → Prisma `User.image`**, file type + size limits. |
| `app/api/settings`, `profile` | AUTH_REQUIRED | Y | Y | Y | Partial | |
| `app/api/dashboard/**` | AUTH_REQUIRED | Y | Y | Verify | Partial | `analytics` mock unused vars — **NEEDS_REVIEW**. |
| `app/api/money-mentor` | AUTH_REQUIRED | Y | N | N/A | Y | **Zod + rate limit + bugfix** restricted topics. |
| `app/api/feedback` | AUTH_REQUIRED | Y | N | Y | Y | **Rate limit**; Zod errors no longer return raw `details`. |
| `app/api/gigs/**`, `aggregated-gigs/**`, `analytics/gigs` | Mixed | varies | N | varies | Partial | Public-ish gig catalog vs user applications — **NEEDS_REVIEW** per handler. |
| `app/api/debug/**`, `test/**`, `sentry-example-api` | NEEDS_FIX or DEV_ONLY | N | varies | N | N | **Disable or protect in production** (information disclosure). |
| `app/api/stripe/connect/**` | AUTH_REQUIRED | Y | Y | Verify | Partial | User’s Connect onboarding; verify Stripe account ownership. |
| `app/api/reports`, `import`, `export` | AUTH_REQUIRED | Y | Y | Verify | Partial | |
| `app/api/notifications/**`, `bookings`, `mentors/**`, … | AUTH_REQUIRED | mostly Y | varies | Verify | Partial | Large surface — **ongoing Zod + owner audit**. |

*(Full file list: enumerate with `Get-ChildItem -Path app/api -Recurse -Filter route.ts` — 130 files.)*

---

## Client-supplied `userId` (anti-pattern)

Audit grep target: `userId` from `req.json()` / `body`.

| Risk | Mitigation |
| --- | --- |
| `savings-goals` POST previously used `userId` from body | **Removed** — only `session.user.id`. |
| Other routes | Search codebase for `userId` destructuring from request bodies on mutating handlers; replace with session. |

---

## Drizzle / duplicate DB clients

| File | Issue |
| --- | --- |
| `app/api/invoices/[invoiceId]/[id]/download/route.ts` | Uses `@/lib/db`, Drizzle `eq`, broken `authOptions()` call — **NEEDS_FIX** (Prisma + `requireAuthSession` + PDF stream). |
| Historical `_db` / `_prisma` imports | Many broken placeholders; prefer `@/lib/prisma` only. |

---

## Stripe

| Item | Status |
| --- | --- |
| Webhook signature | **Implemented** in `app/api/webhooks/stripe/route.ts`. |
| `metadata.invoiceId` | Validated as CUID; paired with `metadata.userId`. |
| `verify-payment` API | Must remain **non-authoritative** vs webhook for final paid state (documented in completion report). |

---

## Rate limiting (Upstash)

| Bucket | Routes |
| --- | --- |
| `auth_signup` | `POST /api/auth/signup` (strict: 503 if Redis missing in production). |
| `invoice_payment_session` | `POST /api/invoices/create-payment-intent` |
| `plaid_link_token`, `plaid_exchange`, `plaid_transactions` | Bank routes |
| `ai_money_mentor` | `POST /api/money-mentor` |
| `feedback_submit` | `POST /api/feedback` |

When `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are unset, non-strict buckets allow traffic (documented); strict buckets return **503** in production.

---

## Environment validation (`lib/env.ts`)

Validated at runtime via `validateServerEnv()` / `assertCoreServerEnv()`:

- **Required:** `NEXTAUTH_SECRET` (min 16 chars recommended), `DATABASE_URL`
- **Optional / warned in prod:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DIRECT_URL`, Supabase public keys, Plaid trio, Upstash pair, `CRON_SECRET`

---

## Remaining risks (pre–beta)

1. **Webhook idempotency** — no `StripeEvent` dedupe table.  
2. **Plaid** — token storage is implemented (encrypted at rest); remaining risk is **webhook verification** and **sync idempotency** at scale (see `financial-automation-foundation-completion-report.md`).  
3. **Large API surface** — many `NEEDS_REVIEW` / `NEEDS_FIX` routes still need per-handler Zod + owner verification.  
4. **Debug/test routes** — must not ship enabled in production.  
5. **`lib/stripe.ts`** legacy webhook helpers reference non-existent Prisma fields — **do not use** until reconciled with schema or deleted.

---

## References

- OWASP API Security Top 10 (2023)  
- OWASP ASVS v4  
- NextAuth `getServerSession` + JWT session strategy  
- Stripe webhook signing: https://stripe.com/docs/webhooks/signatures  
- Next.js App Router Route Handlers: raw body before JSON parse for webhooks  
