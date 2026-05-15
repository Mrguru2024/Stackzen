# Phase 1 — Stabilization audit (StackZen)

**Date:** 2026-04-30  
**Scope:** Audit only (Step 1). Implementation tracked separately in `docs/phase-1-completion-report.md`.

---

## 1. Executive summary

StackZen is a **Next.js 15 App Router** app with **Prisma + PostgreSQL** as the canonical data layer, **NextAuth v4 (JWT)** as the primary session system, and optional **Supabase** clients for Postgres-aligned helpers and SSR cookie refresh. **Stripe** and **Plaid** integrations exist.

The codebase shows **inconsistent import aliases** (`_getServerSession` vs `getServerSession`), **multiple `PrismaClient` instantiations**, **partial Drizzle usage** alongside Prisma, **broken invoice/payment API handlers** (undefined identifiers, schema drift), and **quote APIs** that reference **non-existent Prisma models** in extended paths. **Password reset API routes** reference a **non-existent** `passwordResetToken` Prisma model.

**No second auth “system”** was introduced in product intent: Supabase `signInWithPassword` is used only inside NextAuth `authorize()` to validate passwords when appropriate; sessions remain **NextAuth JWT**.

---

## 2. Current auth flow

| Layer | Mechanism | Location |
|--------|-----------|----------|
| Session | NextAuth **JWT** (`session.strategy: 'jwt'`) | `app/api/auth/[...nextauth]/route.ts` |
| OAuth / email | Google, Email (Nodemailer), Credentials | Same file |
| Adapter | `PrismaAdapter(prisma)` | Same file |
| Credentials | Prisma `User.password` (bcrypt) and/or Supabase `signInWithPassword` then ensure `User` row | Same file |
| `authOptions` re-export | `lib/auth-config.ts` → `app/api/auth/[...nextauth]/route.ts` | Single source for `getServerSession(authOptions)` |
| Middleware | `getToken` (JWT) + Supabase `updateSession` + `checkTrialAccess` | `middleware.ts`, `middleware/trial-check.ts`, `lib/supabase/middleware.ts` |
| Client | `SessionProvider` | `components/providers/AppProviders.tsx` |

**Conflicts / risks**

- `lib/auth.ts` exports `getServerAuthSession()` but historically imported **`_getServerSession`** without wiring `getServerSession` / `authOptions` → **runtime failure** if called.
- Many API routes import **`_getServerSession`** from `next-auth` and call **`getServerSession(authOptions)`** with **undefined** imports → **broken unless tree-shaken differently** (they rely on globals or fail at runtime).
- `lib/auth.ts` also re-exported `authOptions` twice in a confusing pattern.

---

## 3. Current database / ORM flow

| Layer | Role | Notes |
|--------|------|--------|
| **Prisma** | Canonical ORM; `User`, `Invoice`, `Quote`, etc. | `prisma/schema.prisma`, **`lib/prisma.ts` singleton** (intended) |
| **Drizzle** | Secondary; `lib/db.ts`, `lib/schema.ts`, `lib/db/schema.ts` | Used by **webhooks/stripe**, **performance**, **invoice pay/download**, **upload-logo**, **route-cached** — **parallel ORM** risk |
| **`lib/database.ts`** | `DatabaseService` toggling Prisma vs Supabase REST | Used by **smart-saving** APIs via `createDatabaseService`; **top of file has broken imports** (`_PrismaClient`, `createClient` vs `_supabase`) |

**Duplicate `new PrismaClient()` (non-exhaustive)**

- `app/api/auth/[...nextauth]/route.ts`
- `app/api/invoices/route.ts`
- `app/api/auth/reset-password/route.ts`
- `app/api/auth/request-reset/route.ts`
- `lib/auth/session.ts`, `lib/auth/security.ts`, `lib/database.ts`, `lib/db/query-optimizer.ts`

**Recommendation (pre-code):** Prefer **`import { prisma } from '@/lib/prisma'`** everywhere except tests.

---

## 4. Supabase usage (not duplicate session system)

| Area | Purpose |
|------|---------|
| `lib/supabase/server.ts`, `client.ts`, `middleware.ts` | SSR/browser clients, session refresh |
| `utils/supabase/*` | Re-exports |
| `lib/supabaseServer.ts` | Server `createClient` for API routes |
| NextAuth `authorize` | `signInWithPassword` when Prisma bcrypt path insufficient | `app/api/auth/[...nextauth]/route.ts` |

Supabase is **not** the primary session store; **NextAuth JWT** is.

---

## 5. Quote → invoice → Stripe payment (as implemented / broken)

### Quotes

- **File:** `app/api/quotes/route.ts`
- **GET:** Uses `prisma` / `getServerSession` / `authOptions` / `NextResponse` with **mismatched variable names** (`_quotes` vs `quotes`). Dev mode **skipped auth** (risk).
- **POST (extended):** Uses **`prisma.location`** and rich payload — **`Location` model does not exist** in `schema.prisma`. **Quote** model is minimal: `id`, `userId`, `title`, `content`, `status`, timestamps only.
- **POST (minimal):** Intended path `{ userId, title, content, status }` but uses **`data` vs `_data`** bugs.

### Invoices

- **File:** `app/api/invoices/route.ts` — Uses own `new PrismaClient()`; **GET lists all invoices** without **`where: { userId }`** → **authorization/data leak risk**.
- **Files:** `app/api/invoices/create-payment-intent/route.ts`, `app/api/invoices/[invoiceId]/create-payment-intent/route.ts`, `app/api/invoices/verify-payment/route.ts` — **Broken imports** (`_NextResponse`, `_getServerSession`, `_prisma`, `_authOptions`) and **undefined variables** (`session`, `prisma`, `stripe`, `invoice`, `paymentIntent`). **verify-payment** references **`stripePaymentIntent`**, **`paid`**, **`paidAt`** — **not on `Invoice` model** (schema has `status`, `amount`, etc.).

### Stripe

- Secret key only on server (OK) but **responses must not log** full Stripe objects in production (audit: grep `console.log` in payment paths).

---

## 6. Security / middleware / rate limit

| Utility | Path | Notes |
|---------|------|--------|
| Rate limit | `lib/auth/rate-limit.ts` | Instantiated in `middleware.ts` |
| IP blocker | `lib/auth/ip-blocker.ts` | Same |
| Redis edge | `lib/redis-edge.ts` | Optional when Upstash URL invalid |
| Security monitor / audit | `lib/auth/security-monitor.ts`, `security-audit.ts` | Supabase-backed tables (optional) |
| Middleware matcher | Excludes `api`, static | **API routes are not wrapped** by root middleware — each route must enforce auth |

---

## 7. Conflicting or high-risk files (priority)

1. **`app/api/invoices/create-payment-intent/route.ts`** — unusable as-is (undefined symbols).
2. **`app/api/invoices/[invoiceId]/create-payment-intent/route.ts`** — same; uses `invoice.total` but schema has **`amount`**.
3. **`app/api/invoices/verify-payment/route.ts`** — schema drift (`paid`, `stripePaymentIntent`).
4. **`app/api/invoices/[invoiceId]/route.ts`** — same import/variable bugs; **missing ownership checks**.
5. **`app/api/quotes/route.ts`** — auth + variable bugs; extended POST **incompatible with schema**.
6. **`lib/auth.ts`** — broken server session helper.
7. **`lib/db.ts`**, **`lib/database.ts`** — broken imports; still **imported** by webhooks / smart-saving / performance — **high blast radius** if executed.
8. **`app/api/auth/reset-password`**, **`request-reset`** — **`passwordResetToken` model missing** from Prisma schema.

---

## 8. Recommended fixes (before / during Phase 1 code)

1. **Centralize Prisma:** `import { prisma } from '@/lib/prisma'` in NextAuth route, invoices route, and any touched auth routes.
2. **Centralize server session:** Fix `lib/auth.ts`; add **`lib/api/require-auth.ts`** returning `401` JSON for API routes (optional adoption route-by-route).
3. **Invoices GET:** `where: { userId: session.user.id }` (and ensure POST already scopes `userId`).
4. **Invoice by id:** After fetch, `if (invoice.userId !== session.user.id) return 403`.
5. **Payment intents:** Fix imports/variables; use **`invoice.amount`**; enforce **user owns invoice**; avoid leaking Stripe secrets in logs.
6. **verify-payment:** Use Stripe `metadata.invoiceId` or lookup by `userId` + amount workflow; update **`status: 'paid'`** only (no phantom columns).
7. **Quotes:** Fix GET/POST variable names; **require session** in dev; return **501** (or documented error) for extended payload until schema supports it.
8. **Password reset:** Either add Prisma models + migration **or** return **501** with clear message until schema exists (honest API contract).

---

## 9. Out of scope for Phase 1 (suggest Phase 2)

- Rewriting all smart-saving routes and `lib/database.ts` / `lib/db.ts` consumers to Prisma-only.
- Removing Drizzle entirely (touches webhooks, performance, invoices pay/download).
- UI redesign, new dashboards, new features.
- Full test suite green (known TS issues in e.g. large dev components).

---

## 10. Validation commands (Step 3)

```bash
npm run lint
npx tsc --noEmit
npx prisma validate
npm test
```

Address only failures **introduced or unblocked** by Phase 1 edits.

---

## 11. Phase 1 implementation (post-audit)

See **`docs/phase-1-completion-report.md`** for the exact file list, validation results (`prisma validate`, `eslint` on touched files, `tsc` baseline), and remaining work.

Added **`lib/api/require-auth.ts`** as an optional shared guard for future API routes (not yet wired into every handler).
