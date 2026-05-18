# Phase 8 — Monitoring & Incident Response Implementation Log

**Status:** Complete (100%)  
**Date:** 2026-05-16

## Checklist

| # | Requirement | Status |
|---|-------------|--------|
| 8.1a | `beforeSend` redaction via `lib/security/redact.ts` | Done — server, edge, client |
| 8.1b | Audit log write failure breadcrumbs | Done — `writeAuditLog` catch |
| 8.1c | Rate limit 429 breadcrumbs (sampled) | Done — API `enforceApiRateLimit` + `proxy.ts` edge |
| 8.1d | Performance tracing on sensitive routes | Done — `sentryTracesSampler` |
| 8.1e | Sentry Next.js wiring (`withSentryConfig`) | Done — `next.config.js` |
| 8.1f | Client Replay with masking | Done — `sentry.client.config.ts` |
| 8.1g | `onRequestError` → Sentry | Done — `instrumentation.ts` |
| 8.1h | `lib/monitoring.ts` wired to safe capture | Done |
| 8.2 | Startup validation | Done — `instrumentation.ts` + env warnings |
| 8.3 | `SECURITY_INCIDENT_RESPONSE.md` | Done |

## Files

| File | Role |
|------|------|
| `lib/security/sentry.ts` | Shared init, `beforeSend`, breadcrumbs, `captureSafeException` |
| `sentry.server.config.ts` | Node server runtime |
| `sentry.edge.config.ts` | Edge runtime |
| `sentry.client.config.ts` | Browser + Session Replay (masked) |
| `instrumentation.ts` | Env asserts + `onRequestError` |
| `lib/monitoring.ts` | App logger → Sentry breadcrumbs/exceptions |
| `proxy.ts` | Edge rate-limit / IP-block breadcrumbs |
| `docs/security/SECURITY_INCIDENT_RESPONSE.md` | Runbook |

## Environment

```env
NEXT_PUBLIC_SENTRY_DSN="https://…"
SENTRY_ORG="your-org"           # optional — source map upload
SENTRY_PROJECT="stackzen"        # optional
SENTRY_AUTH_TOKEN="…"            # optional — CI release/source maps
SENTRY_ENABLE_DEV="true"         # optional — enable Sentry in local dev
SENTRY_DEBUG="true"              # optional — verbose Sentry logs
```

Production startup warns if `NEXT_PUBLIC_SENTRY_DSN` is missing.

## Verification

```bash
npx jest lib/security/__tests__/sentry.test.ts lib/security/__tests__/redact.test.ts
npm run build   # confirms withSentryConfig wraps cleanly
```

Manual: trigger a test error in staging with DSN set; confirm Sentry event has `[REDACTED]` for `Authorization` headers.

## Architecture note

**Supabase + Prisma retained** — no change to dual-auth/data pattern (see Phase 7).
