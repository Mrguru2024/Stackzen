# StackZen Security Incident Response

**Owner:** Engineering / Security lead  
**Last updated:** 2026-05-16  
**Scope:** Production incidents affecting confidentiality, integrity, or availability of customer financial data.

## Severity levels

| Level | Examples | Target response |
|-------|----------|-----------------|
| **SEV-1** | Active data breach, mass credential leak, payment tampering | Immediate containment (< 1 h) |
| **SEV-2** | Single-tenant IDOR exploit, admin MFA bypass, Plaid token exposure | Same day containment |
| **SEV-3** | Rate-limit bypass, audit log gap, non-exploited misconfiguration | Fix in next release |

## 1. Detection

- **Sentry** (`NEXT_PUBLIC_SENTRY_DSN`) — redacted errors and sampled traces on `/api/bank/*`, `/api/invoices/*`, `/api/admin/*`, `/api/plaid/*`, Stripe webhooks (see `lib/security/sentry.ts`)
- **Prisma `AuditLog`** — `auth.login_failed`, `suspicious.*`, `admin.*`, `plaid.webhook_received`, `stripe.webhook_processed`
- **Admin** — `/api/admin/audit-logs`, `/api/admin/security-events`
- **Infrastructure** — Vercel alerts, Supabase dashboard, Stripe/Plaid dashboards

## 2. Containment (first 60 minutes)

1. **Identify blast radius** — affected users, routes, time window (audit log + Sentry).
2. **Revoke access** — disable compromised admin accounts; `POST` revoke sessions via admin devices / password reset.
3. **Rotate secrets** (see checklist below) if tokens or keys may be exposed.
4. **Block abuse** — IP block list (`IPBlocker`), tighten `SECURITY_STRICT_RATE_LIMIT`, enable Turnstile on auth if not already.
5. **Preserve evidence** — export audit CSV from admin API; do not delete `AuditLog` rows.

## 3. Eradication & recovery

- Deploy patch on a hotfix branch; run `npx prisma migrate deploy` only if schema fix required.
- Re-encrypt rotated fields (Plaid re-link for affected `BankConnection` if `BANK_TOKEN_ENCRYPTION_KEY` rotated).
- Verify webhooks: Stripe signature + Plaid signing secret still valid after rotation.

## 4. Notification

- **Internal:** engineering lead + product owner within SEV window.
- **Users / regulators:** follow legal counsel; document decision in postmortem.
- **Processors:** notify Stripe / Plaid if their credentials or customer financial data involved.

## 5. Postmortem (within 5 business days)

Template:

- Timeline (UTC)
- Root cause
- Why existing controls did not prevent (or did detect)
- Remediation PRs
- Follow-up tasks with owners

Store in `docs/security/postmortems/YYYY-MM-DD-title.md` (create folder per incident).

## Credential rotation checklist

| Secret | When to rotate | After rotation |
|--------|----------------|----------------|
| `NEXTAUTH_SECRET` | Session forgery suspected | All users re-login |
| `BANK_TOKEN_ENCRYPTION_KEY` | DB backup leak | Re-link bank accounts; re-enroll TOTP |
| `STRIPE_WEBHOOK_SECRET` | Webhook spoofing | Update Stripe dashboard + env |
| `PLAID_SECRET` / webhook signing | Plaid abuse | Rotate in Plaid dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Server leak | Rotate in Supabase; review RLS |
| `SESSION_HASH_PEPPER` | IP/session hash leak | Low urgency; rotate with deploy |
| Database password | Direct DB compromise | `DATABASE_URL` + connection pool restart |

## Evidence handling

- Do not commit secrets or full PII to git.
- Redact exports using `lib/security/redact.ts` patterns before sharing externally.
- `AuditLog` and `AiInteractionLog` are append-only — use for timelines, not tampering.

## Contacts (fill in for your org)

| Role | Contact |
|------|---------|
| On-call engineer | _TBD_ |
| Security lead | _TBD_ |
| Legal / privacy | _TBD_ |
