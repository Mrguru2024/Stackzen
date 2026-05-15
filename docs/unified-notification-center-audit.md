# Unified Operational Notification Center — Audit (Phase 1)

**Scope:** Existing notification, alert, event, reminder, and UI pathways in StackZen relevant to an operational attention surface. No new tables were assumed for this audit; findings reflect the codebase and `schema.prisma` at audit time.

## 1. Existing notification systems

| Surface | Persistence | Ownership | Notes |
|--------|-------------|-----------|--------|
| **`AutomationNotification`** (Prisma) | Yes (`AutomationNotification`) | `userId` FK | Canonical in-app automation/fintech alerts: severity (`NotificationSeverity`), `readAt`, `relatedEntityType` / `relatedEntityId`, `metadata` JSON. |
| **`FinancialEvent`** (Prisma) | Yes (`FinancialEvent`) | `userId` FK | Append-only ledger of financial/automation occurrences; includes guardrail events, automation outcomes, invoice/job events, `AUTOMATION_NOTIFICATION_CREATED`. |
| **`NotificationService`** (`lib/services/notification-service.ts`) | **No** for in-app | N/A | Email via Resend for legacy “SpendingGuardrail” shape; `createInAppNotification` is a **no-op** (comment: no Notification table). |
| **`GET/PATCH /api/notifications`** | **Broken** | Intended session user | References **`prisma.notification`**, which **does not exist** in `schema.prisma` — runtime failure if called. |
| **`components/notifications/index.tsx`** | **Broken** | N/A | Server component calls **`prisma.notification`** — same schema mismatch. |
| **`useNotifications`** (`lib/hooks/useNotifications.ts`) | N/A (client) | N/A | Expects `/api/notifications` and subpaths (`/read-all`, `/[id]/read`) that **do not match** implemented routes — integration drift. |
| **`GET /api/automation/notifications`** | Yes | `requireAuthSession` | Lists up to 100 `AutomationNotification` rows for the user. |
| **`PATCH /api/automation/notifications/[id]`** | Yes | Row must match `userId` | `markRead`, `snoozeHours`, `dismiss` (metadata `snoozedUntil`, `dismissedAt`). |
| **`POST /api/notifications/email`** | N/A | Session | **Mentor/session email triggers** (Resend-like flows), not financial operational alerts. |
| **Money Control — Alerts tab** (`components/money-control/index.tsx`) | Via API | Session | Renders `AutomationNotification` with read/snooze/dismiss and a **single** derived “open transaction” link from `metadata.actions`. |
| **GoalNotifications** (`components/wellness/notifications/GoalNotifications.tsx`) | Client-only / utilities | N/A | Wellness goal milestones; uses `sendGoalNotification` helper — **parallel UX** to automation alerts, different domain. |
| **User preferences** (`UserSettings`, `UserOnboardingData.notificationPreferences`) | Yes | User | Booleans/toggles for email/push/goal reminders etc.; **not** wired into `AutomationNotification` lifecycle. |

**Conclusion:** The only coherent persisted in-app notification model is **`AutomationNotification`**. Anything referencing **`notification`** Prisma delegates is orphaned.

## 2. Existing action metadata systems

- **`lib/financial-automation/actionable-metadata.ts`** defines `AutomationClientAction` and `buildAutomationActionMetadata({ version: 1, actions })` used when creating notifications in **`lib/financial-automation/rules-engine.ts`** (e.g. `REVIEW_TRANSACTION`, `ADJUST_CATEGORY`, `EDIT_ALLOCATION_RULE`, `CREATE_GOAL`, `MARK_EXPECTED`, `SNOOZE`, `IGNORE_MERCHANT_TRIGGER`).
- **Money Control** partially consumes `metadata.actions` (first action with `financialTransactionId`) to build **`/money-control?tab=review&txnId=...`** — other action types have **no shared executor** on the client.
- **`rules-engine.ts` guardrail path** is syntactically valid (`OVERSPENDING_ALERT` emission + `createAutomationNotification`); extend actions via `actionable-metadata.ts` and keep `npm run typecheck` green.

## 3. Operational alert flows (end-to-end)

| Flow | Trigger | Persisted alert? | FinancialEvent |
|------|---------|------------------|----------------|
| Income / paycheck / gig deposit | Rules engine classification | Yes (`AutomationNotification`) | Implicit via notification create → `AUTOMATION_NOTIFICATION_CREATED` |
| Guardrail warn/breach | Rule evaluation on transactions | Yes + event | `GUARDRAIL_WARNING` / `GUARDRAIL_BREACH` + notification |
| Low balance | Periodic evaluation | Yes | Via `AUTOMATION_NOTIFICATION_CREATED` |
| Overspend / bill / milestone / automation | Rule actions | Mixed (engine) | Per rule + notification path |
| Bank sync | `sync-runner` | Not always surfaced as AutomationNotification | `TRANSACTION_CREATED`, `BANK_SYNC_*`, etc. |
| Invoice / job lifecycle | Invoice/job APIs | **Mostly FinancialEvent-only** unless automation creates a notification | `INVOICE_*`, `JOB_*`, deposits |

**FinancialEvent timeline API:** `GET /api/financial-events/timeline` + `lib/financial-events/query.ts` — used by Money Control “Activity”; good for explanation, not unified with alert actions.

## 4. Reminder systems

- **`RecurringBill.reminderDaysBefore`** — scheduling intent in schema; reminders should flow through automation (e.g. `BILL_DUE`) — verify cron/schedulers separately.
- **Mentor session** emails — orthogonal product surface.
- **BudgetAllocation.notifications** boolean — historically tied to **`NotificationService.checkSpendingGuardrails`** legacy type (`SpendingGuardrail` interface), **not** to `AutomationNotification`.
- **UserSettings.goalReminders / challengeUpdates** — preference flags without a unified dispatcher audit in this pass.

## 5. Fragmentation risks

- **Dual “notification” namespaces:** broken Prisma `notification` vs real `AutomationNotification`.
- **Passive vs operational:** legacy `NotificationService` in-app path is deliberately empty; email-only mentor channel vs automation in-app creates **channel inconsistency**.
- **UI fragmentation:** Alerts live under Money Control; no single “attention” home; GoalNotifications duplicates “notification card” UX for wellness only.
- **Action execution fragmentation:** Actions exist in metadata but UI only honors one pattern (transaction deeplink).

## 6. Duplicate or conflicting models

- **No separate `Notification` model** in schema — referencing it is duplicate *concept*, not duplicate table (phantom duplicate).
- **FinancialEvent vs AutomationNotification:** not duplicates — **relationship** should be complementary (event explains “why”; notification drives “what to do”).
- **`NotificationSeverity` vs `FinancialEventType`:** orthogonal enums; prioritization UX must map explicitly.

## 7. Missing operational workflows (gaps)

- **Invoice/payment/job attention** persisted as **`AutomationNotification`** was not systematically ensured when invoices are overdue or jobs await deposit/payment — users may rely on lists without an operational alert row.
- **Read/snooze/dismiss semantics:** dismiss and snooze are metadata-based; **`read-all`** pathways for `/api/notifications` were inconsistent with automation routes.
- **Ownership:** Automation routes enforce `userId`; legacy routes used `getServerSession` + different auth barrel — consolidate on `requireAuthSession` where possible.
- **Trust copy:** Alerts often have title/body but not a structured “why / what changed / recommended next step” in `metadata`.
- **AI / predictive:** No production fake data; architecture should reserve `metadata` / `FinancialEvent` for future insight provenance.

## 8. Recommended canonical notification architecture

1. **Single persisted in-app stream:** `AutomationNotification` for all user-facing operational items that require snooze/dismiss/read.
2. **Single explainability stream:** `FinancialEvent` for audit and “why” (and optional timeline join by `relatedEntityType` + `relatedEntityId`).
3. **Single API for product UI:** dedicated operational alerts endpoint that can **ensure** missing business-critical notifications (idempotent) before read.
4. **Deprecate or repair** any `prisma.notification` usage; align `useNotifications` with automation + operational API.
5. **Metadata contract:** versioned `actions[]`, `attentionKind`, `trust: { cause, changeSummary, recommendedStep }` for fintech-grade copy.

## 9. Recommended action execution flow

1. **Server:** Returns normalized alert DTOs with typed `actions` and deep links (or action codes).
2. **Client:** Deterministic router — `REVIEW_TRANSACTION` → Money Control review sheet; `OPEN_INVOICE` → `/invoices/[id]`; `OPEN_JOB` → `/jobs/[jobId]`; `EDIT_ALLOCATION_RULE` → rules tab / future rule editor; `SNOOZE` → existing PATCH; dismiss/read → existing PATCH.
3. **No duplicate POST “notification” APIs** for the same state change.

## 10. Safe consolidation strategy

1. **Fix schema drift** — remove or replace all `prisma.notification` references with `AutomationNotification` or the new operational API.
2. **Introduce operational alerts API** — `ensure` idempotent attention records for invoice/job money states using existing `createAutomationNotification` helper.
3. **One primary UI** — Operational Center page + embed in Money Control for continuity (avoid a second passive feed-only page).
4. **Gradual retirement** — Point `useNotifications` and legacy `/api/notifications` at the same underlying model for backward compatibility.
5. **Do not add** a second notification table; extend enums/metadata only with migration discipline when new alert *types* are required.

---

**Files explicitly reviewed for this audit:** `prisma/schema.prisma`, `lib/financial-automation/rules-engine.ts`, `lib/financial-automation/actionable-metadata.ts`, `lib/financial-events/events.ts`, `lib/financial-events/query.ts`, `app/api/automation/notifications/*.ts`, `app/api/notifications/route.ts`, `app/api/financial-events/timeline/route.ts`, `lib/services/notification-service.ts`, `components/money-control/index.tsx`, `components/notifications/index.tsx`, `lib/hooks/useNotifications.ts`, `components/wellness/notifications/GoalNotifications.tsx`, `config/nav-links.ts`.
