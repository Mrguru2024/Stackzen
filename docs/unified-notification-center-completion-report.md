# Unified Operational Notification Center — Completion Report (Phase 5)

## Deliverables shipped

### Documentation

| File | Purpose |
|------|---------|
| [unified-notification-center-audit.md](./unified-notification-center-audit.md) | Phase 1 catalogue of notification/event surfaces, phantom `Notification` usages, fragmentation, and consolidation strategy |
| [unified-notification-center-architecture.md](./unified-notification-center-architecture.md) | Phase 2 lifecycle, metadata contract, prioritization mapping, scalability |
| **This report** | Phases 3–5: files changed, systems reused, validation, gaps |

### Runtime systems reused (no duplicate notification tables)

- **`AutomationNotification`** — single persisted operational queue.
- **`createAutomationNotification`** + **`AUTOMATION_NOTIFICATION_CREATED`** **`FinancialEvent`** wiring (existing `rules-engine` behavior).
- **`FinancialEvent`** + **`GET /api/financial-events/timeline`** for correlation on demand.
- **Auth** — **`requireAuthSession`** for new/fix routes.
- **`PATCH /api/automation/notifications/[id]`** — read/snooze/dismiss unchanged contract (metadata timestamps).

### New library modules

| Path | Role |
|------|------|
| `lib/operational-notifications/helpers.ts` | Shared snooze/dismiss + **attention-queue** predicates |
| `lib/operational-notifications/types.ts` | Stable DTOs for UI + grouping |
| `lib/operational-notifications/enrich.ts` | Map Prisma notifications → enriched DTOs + latest `FinancialEvent` correlation |
| `lib/operational-notifications/ensure-attention.ts` | Idempotent **`AutomationNotification`** creation for overdue / due-soon invoices and jobs awaiting deposit or balance |

### New / updated APIs

| Route | Behavior |
|-------|----------|
| **`GET /api/operational-center/alerts`** | Optional **`ensure`** (default true) → **`ensureOperationalAttentionNotifications`**, list + group by domain |
| **`GET /api/notifications`** | **Fixed**: reads **`AutomationNotification`** and returns legacy-compatible `{ title, message, type, read, createdAt }` payloads |
| **`PATCH /api/notifications/read-all`** | **Added**: forwards to bulk `readAt` on automation notifications |
| **`PATCH /api/notifications/[id]/read`** | **Added**: single-mark-read |
| **`DELETE /api/notifications/[id]`** | **Added**: dismissal via `metadata.dismissedAt` |

### UX

| Surface | Behavior |
|---------|----------|
| **`/operational-center`** | Operational attention hub (queues, grouping, linked workflows, trust copy) |
| **`config/nav-links.ts`** | **Operational Center** nav entry (Bell icon) preceding Money Control |
| **`Money Control` Alerts tab** | Shares **`OperationalAlertCards`** + **`/api/operational-center/alerts`** (parity with unified center) |
| **`components/notifications/index.tsx`** | Redirects legacy passive page to Operational Center |

### Action metadata extensions

[`lib/financial-automation/actionable-metadata.ts`](../lib/financial-automation/actionable-metadata.ts)

- **`OPEN_INVOICE`**, **`OPEN_JOB`**, **`OPEN_CLIENT`**, **`OPEN_BUCKET`**, **`PAY_INVOICE`**
- **`buildOperationalAttentionMetadata`** for invoice/job ensure rows + trust fields

### Automated tests added/updated

- `components/notifications/Notifications.test.tsx`
- `components/operational-center/OperationalAlertCards/OperationalAlertCards.test.tsx`

### Storybook stubs

- `components/notifications/Notifications.stories.tsx` (delegates visually to Operational Center embedded)
- `components/operational-center/OperationalAlertCards/OperationalAlertCards.stories.tsx`
- `components/operational-center/OperationalAlertCenter/OperationalAlertCenter.stories.tsx`

## Duplicate systems deliberately avoided

- No new **`Notification`** Prisma table.
- No isolated “notifications feed-only” persistence path.
- No AI-generated placeholders.

## Operational workflows now connected

- **Ledger review** (`REVIEW_TRANSACTION`, `ADJUST_CATEGORY`, Money Control deeplinks)
- **Rule steering** (`EDIT_ALLOCATION_RULE` → Money Control rules tab)
- **Invoices** (`OPEN_INVOICE`, `PAY_INVOICE` routed to invoice detail where Stripe-hosted pay requires checkout intent separately)
- **Jobs / clients** (`OPEN_JOB`, `OPEN_CLIENT`)
- **Read/snooze/dismiss** via unchanged automation PATCH

## Notification consolidation status

| Area | Status |
|------|--------|
| Phantom `prisma.notification` usages | Removed/fixed (`/api/notifications`, legacy component redirect) |
| Operational UI entry | Single primary route + Money Control parity |
| Business invoice/job backlog | Persisted alerts via **`ensureOperationalAttentionNotifications`** |
| Passive mentor email channel | Unchanged orthogonal surface (`/api/notifications/email`) |

## Action execution status

- **Navigate-and-fix** flows implemented for typed `AutomationClientAction` extensions.
- **`SNOOZE`** still resolved through automation PATCH (`snoozeHours`).
- **`MARK_EXPECTED`** / **`IGNORE_MERCHANT_TRIGGER`** remain metadata signals until dedicated PATCH endpoints exist — UI degrades gracefully to Money Control.

## Validation results

| Command | Result |
|---------|--------|
| `npm run typecheck` | **Pass** |
| `npx prisma validate` | **Pass** when `DIRECT_URL` populated (often mirror `DATABASE_URL` for hosted Postgres; see `.env` note below) |
| `npx prisma generate` | **Pass** |
| Targeted **Jest** suites for new notification tests | **Pass** |

## Remaining production gaps (explicit)

1. **Environment:** Add **`DIRECT_URL`** to `.env` (Supabase / pooled hosts commonly require mirror connection string); without it **`prisma validate` fails**.
2. **Snoozed queue surfacing:** Snoozed items leave the attention queue intentionally; dedicated “Snooze inbox” UX not shipped (filter could be layered client-side via `snoozedUntil`).
3. **Stale operational rows:** Clearing automation notifications automatically when invoices become `paid`/jobs finalize may require transactional hooks or nightly reconciliation (not implemented here).
4. **`OPEN_BUCKET`:** Deeplink ignores `bucketId` until Money Control respects a highlight query param (future tighten).
5. **Email fan-out:** `NotificationService` automation email path unchanged; Operational Center stays in-app first.
6. **AI insights:** Slots reserved exclusively in **`metadata`** / **`FinancialEvent`**; no synthetic payloads generated.

## Fintech readiness assessment

**Ready for guarded production pilot** where:

- users understand read/snooze semantics,
- accountants route through invoice/job detail flows,
- `DIRECT_URL` is configured for migrations/CI parity.

Further hardening should focus on reconciliation (stale rows), webhook-driven refresh, richer bucket highlights, and real AI attribution when models are introduced.
