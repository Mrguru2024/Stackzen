# StackZen Security Release Checklist

**Purpose:** Ship gate before production deploys or major security releases.  
**Last updated:** 2026-05-16  
**Owner:** Release engineer + security reviewer (can be same person on small teams).

Complete every **Required** item; **Recommended** items should be addressed or explicitly waived with a ticket.

---

## 1. Environment & secrets

| # | Check | Required |
|---|--------|----------|
| 1.1 | `NODE_ENV=production` on production runtime | ✅ |
| 1.2 | `NEXTAUTH_SECRET` set (32+ chars in prod) | ✅ |
| 1.3 | `BANK_TOKEN_ENCRYPTION_KEY` set (32+ chars) — **not** reused from Plaid/Stripe | ✅ |
| 1.4 | `DATABASE_URL` / `DIRECT_URL` point to production Postgres (pooled URL uses `?pgbouncer=true`) | ✅ |
| 1.5 | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` match live Stripe dashboard | ✅ |
| 1.6 | `PLAID_SECRET` + webhook signing secret match Plaid environment (`PLAID_ENV`) | ✅ |
| 1.7 | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` configured (or `SECURITY_STRICT_RATE_LIMIT` understood) | ✅ |
| 1.8 | No secrets in git — `.env` / `.env.local` not committed | ✅ |
| 1.9 | `node scripts/check-public-env.mjs` passes | ✅ |
| 1.10 | `NEXT_PUBLIC_SENTRY_DSN` set for production monitoring | Recommended |

```bash
# Local verification
node scripts/check-public-env.mjs
node scripts/check-financial-owned-queries.mjs
```

---

## 2. Database & migrations

| # | Check | Required |
|---|--------|----------|
| 2.1 | `npm run prisma:generate` succeeds | ✅ |
| 2.2 | `npx prisma migrate deploy` applied on staging, then production | ✅ |
| 2.3 | Migrations include security phases through `20260516190000_admin_security_mfa_defaults` (or later) | ✅ |
| 2.4 | No destructive migration without backup + rollback plan | ✅ |
| 2.5 | Admin users have `mfaRequired=true` or enroll TOTP before go-live | ✅ |

---

## 3. Application security controls

| # | Control | Verify |
|---|---------|--------|
| 3.1 | Edge policy via `proxy.ts` (not legacy `middleware.ts`) | Rate limits, IP block, admin path buckets |
| 3.2 | Security headers in `next.config.js` | CSP, HSTS when enabled |
| 3.3 | `instrumentation.ts` runs `assertCoreServerEnv` + `assertEncryptionKeyConfigured` | Boot fails fast in prod without key |
| 3.4 | Turnstile on auth + AI chat in production | `TURNSTILE_SECRET_KEY` + site key |
| 3.5 | Admin MFA enforced | `requireAdminSession` returns `MFA_REQUIRED` without TOTP |
| 3.6 | Admin idle timeout (30m) + JWT max 8h for admin roles | See `lib/security/admin-policy.ts` |
| 3.7 | AI consent required | `POST /api/ai/consent` before Money Mentor / recommendations |
| 3.8 | Financial IDOR pattern | Owned queries on invoices/bank/income routes |
| 3.9 | Stripe webhooks authoritative | Client `verify-payment` does not mutate invoice status |

---

## 4. Testing & CI

| # | Check | Required |
|---|--------|----------|
| 4.1 | `npm run test:security` passes | ✅ |
| 4.2 | `npm run typecheck:ci` passes (or project equivalent) | ✅ |
| 4.3 | `npm run build` succeeds | ✅ |
| 4.4 | GitHub Actions workflow `security-tests.yml` green on PR | ✅ |
| 4.5 | No new `eslint` security regressions on touched routes | Recommended |

```bash
npm run test:security
npm run typecheck:ci
npm run build
```

---

## 5. Monitoring & incident readiness

| # | Check | Required |
|---|--------|----------|
| 5.1 | Sentry DSN configured; sample event shows redacted headers | Recommended |
| 5.2 | `docs/security/SECURITY_INCIDENT_RESPONSE.md` contacts filled in | ✅ |
| 5.3 | On-call knows how to export audit logs (`/api/admin/audit-logs?export=csv`) | Recommended |
| 5.4 | Credential rotation checklist reviewed if deploying after incident | As needed |

---

## 6. Admin & access review

| # | Check | Required |
|---|--------|----------|
| 6.1 | `ADMIN` / `SUPER_ADMIN` roles assigned only to intended accounts | ✅ |
| 6.2 | Privileged email list (`lib/auth/privileged-users.ts`) reviewed | ✅ |
| 6.3 | All admins enrolled in TOTP (or approved passkey when `ENABLE_WEBAUTHN`) | ✅ |
| 6.4 | Admin PII access uses `?includeSensitive=true` only when necessary (audited) | Recommended |

---

## 7. AI & privacy (if AI features enabled)

| # | Check | Required |
|---|--------|----------|
| 7.1 | `ENABLE_AI_FEATURES` intentional for environment | ✅ |
| 7.2 | LLM API keys server-only (no `NEXT_PUBLIC_` provider keys) | ✅ |
| 7.3 | Privacy copy links to `AI_PRIVACY_CONTROLS.md` / in-app consent | Recommended |
| 7.4 | `ENCRYPT_CHAT_CONTENT=true` if regulatory requirement for chat at rest | Optional |

See [AI_PRIVACY_CONTROLS.md](./AI_PRIVACY_CONTROLS.md).

---

## 8. Post-deploy smoke tests

Run against **staging** (then spot-check production):

- [ ] Sign up / login (Turnstile if enabled)
- [ ] Enable 2FA on test admin; access `/admin` succeeds
- [ ] Non-admin receives 403 on `/api/admin/users`
- [ ] Create invoice as user A; user B gets 404 on same ID
- [ ] Connect bank (Plaid sandbox); confirm no access token in network response
- [ ] Grant AI consent → Money Mentor chat → clear memory
- [ ] Trigger intentional 429 on auth (optional) — returns JSON, not HTML error

---

## 9. Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Engineering | | | |
| Security / lead | | | |
| Product (AI/privacy) | | | |

**Waivers:** Document any skipped Required item with ticket ID and compensating control.

---

## Related documents

- [DATA_CLASSIFICATION.md](./DATA_CLASSIFICATION.md)
- [SECURITY_IMPLEMENTATION_PLAN.md](./SECURITY_IMPLEMENTATION_PLAN.md)
- [PHASE_10_IMPLEMENTATION_LOG.md](./PHASE_10_IMPLEMENTATION_LOG.md)
- [SECURITY_INCIDENT_RESPONSE.md](./SECURITY_INCIDENT_RESPONSE.md)
