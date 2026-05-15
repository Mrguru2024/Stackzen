# Financial timing coordination & calendar intelligence — audit (Phase 1)

**Status:** Audit only. No code changes in this phase.

This audit catalogs every existing system relevant to **financial timing coordination** in StackZen: recurring obligations, forecast timing, invoice/job timing, goal contribution timing, reserve preparation, operational actions, explainability, money-control scheduling, and the (non-existent) calendar layer.

For each area we list:
- **Where** (file paths / Prisma model fields)
- **What it does today** (one line)
- **What it does NOT do today** (gap relevant to timing coordination)

---

## 1. Existing timing systems

### 1.1 Cash flow forecast timing — `lib/cashflow/**`

| Where | What it does today | What it does NOT do |
|------|--------------------|---------------------|
| `lib/cashflow/forecast.ts` → `buildCashFlowForecast(userId, { includeDetails })` | For each of `[7, 14, 30]` day windows, projects daily events (`CashflowEventDto`) and an optional daily balance series (`DailyBalancePointDto`). | Has no concept of an **obligation cluster** (multiple OUTFLOWs landing within the same N-day band), no payout-vs-bill conflict scoring, no contractor payout overlap. |
| `lib/cashflow/forecast.ts` → `events[]` of kinds `recurring_bill`, `detected_obligation`, `detected_income`, `invoice_expected_payment`, `allocation_drag` | Already produces day-keyed events for the next 30 days — **directly mappable to calendar cells**. | Events are reproduced **per window** (7/14/30 each), so a calendar reader has to dedupe. |
| `lib/cashflow/forecast.ts` → `risks: CashFlowRiskDto[]` (`PROJECTED_LOW_BALANCE`, `ALLOCATION_PRESSURE`, `INVOICE_RECEIVABLE_GAP`, …) | Risk codes already encode some timing-derived pressure. | No risk code for **obligation cluster** or **timing window instability** as a first-class signal. |
| `lib/cashflow/recurrence.ts` → `inferCadenceFromMedianDays`, `nextCadenceDate`, `rollForwardNext` | Detects cadence from transactions. | Cadence math is **forked** with `lib/cashflow/forecast.ts` (`normalizeBillFrequency`, `rollBillStart`, `enumerateOccurrencesInWindow`) — duplicate logic to be careful not to triple. |
| `app/api/cashflow/summary/route.ts` | A pre-forecast heuristic (`Booking × $100`). | Stale; **disconnected** from `buildCashFlowForecast`. New layer must not extend it. |

### 1.2 Recurring obligations — `RecurringBill`

| Where | What it does today | What it does NOT do |
|------|--------------------|---------------------|
| `prisma/schema.prisma:349` model `RecurringBill { id, userId, name, amount, categoryId, categoryName, nextDueDate, frequency, autopayEnabled, reminderDaysBefore, enabled, lastTriggeredAt }` | Stores bill cadence + due date. | **Effectively read-only at app level:** only consumer is `lib/cashflow/forecast.ts:138`. `lastTriggeredAt`, `reminderDaysBefore`, `autopayEnabled` are **never written or read** anywhere. No CRUD UI, no scheduling cron. |
| `RecurringBill.nextDueDate` | Drives forecast event emission for upcoming occurrences. | No mutation path: no API allows shifting `nextDueDate` from the app — drag/drop timing actions need a new, audited write path. |
| `prisma/schema.prisma` — `Expense.isRecurring`, `Expense.nextDueDate`, `AutomationRule.schedule`, `SavingsRule.schedule`, `SavingsRule.lastRunAt`, `AutomationTriggerType.BILL_DUE`, `AutomationNotificationType.BILL_DUE_REMINDER`, `SUBSCRIPTION_INCREASE` | Declared schema-side. | **None of these are emitted or scheduled anywhere.** Treat as stale type surface, not as production timing infrastructure. |

### 1.3 Recurring transactions (detected from ledger)

| Where | What it does today | What it does NOT do |
|------|--------------------|---------------------|
| `lib/cashflow/recurrence.ts` → `detectRecurringPatterns(transactions, now)` | Infers periodic obligations & income from `FinancialTransaction` history. | Does not consider **timing concentration**; obligations spread or clustered are treated identically. |

---

## 2. Existing payout-timing systems

### 2.1 Invoice timing — `Invoice`

| Where | What it does today | What it does NOT do |
|------|--------------------|---------------------|
| `prisma/schema.prisma:566` `Invoice { dueDate, status, amount, paidAt, … }` | Canonical AR record. | No "expected payment date" distinct from `dueDate`; no cluster detection across multiple invoices. |
| `lib/cashflow/forecast.ts` (invoice loop, lines ~211–223) | Maps `Invoice.dueDate` into a `kind: 'invoice_expected_payment'` event when due falls in the 7/14/30 window. | Treats every unpaid invoice with a due date in window as definite inflow — no late-payer dampening for timing-coordination purposes (late-payer summarisation lives in §3). |
| `lib/contractor-operations/collection-intelligence.ts` → `summarizeUpcomingDueSpread(...)` | Returns mean & population stdev of "days until due" for invoices in `(today, today+windowDays]`. | Already detects *spread* but does not flag **clusters** (concentration on a small number of days). |

### 2.2 Detected income series

| Where | What it does today | What it does NOT do |
|------|--------------------|---------------------|
| `lib/cashflow/forecast.ts` → `detectRecurringPatterns(...).income` | Projects paycheck timing forward. | No paycheck-vs-bill overlap conflict; no notion of "the paycheck lands 2 days *after* rent". |

---

## 3. Existing contractor timing systems

### 3.1 Jobs — `Job`

| Where | What it does today | What it does NOT do |
|------|--------------------|---------------------|
| `prisma/schema.prisma:749` `Job { status, depositStatus, expectedRevenue, materialExposure, … }` | Tracks project lifecycle. | No `expectedDepositDate` / `expectedFinalPayoutDate` field — timing inference is currently invoice-side only. |
| `lib/contractor-operations/snapshot.ts` → `buildContractorFinancialOpsSnapshot(userId, { forecast })` | Surfaces material exposure, late payers, collection timing, deposit gates, tax-reserve nudge. | Does not surface **contractor payout overlap with bill cluster** as a timing factor. |
| `lib/contractor-operations/collection-intelligence.ts` → `summarizeLatePayersByClient(...)` | Concentration of late receivables by `clientId`. | Late-payer concentration is portfolio-level; no per-day calendar projection of *which* clients will likely fail to pay on time. |

---

## 4. Existing reserve-preparation systems

### 4.1 Goal contribution timing — `OperationalGoal` + `SmartAllocation`

| Where | What it does today | What it does NOT do |
|------|--------------------|---------------------|
| `prisma/schema.prisma:998` `OperationalGoal { targetDate, lastContributionAt, automationMode, automationConfig, … }` | Stores goal state and last contribution event. | **No `nextContributionAt`** field. No scheduler reads `automationMode` / `automationConfig` — the timing of the *next* contribution is not modeled anywhere. |
| `lib/goals/analyze.ts` → `analyzeOperationalGoal(userId, goal, { forecast })` | Computes `requiredAverageDaily`, `trailing30DayAverageDailyContribution`, `MISSED_TARGET_PACE`. | All daily-aggregated; no per-day projection of contribution events that a calendar could render. |
| `lib/goals/apply-contribution.ts` → `recordGoalContribution(...)` | Canonical write path: writes `SmartAllocation` + bumps `SmartBucket.currentAmount` + writes `GOAL_CONTRIBUTION_RECORDED` event. | Used today only from operational-actions apply; no scheduled / timing-driven invocation. |

### 4.2 Reserve allocation intelligence — `lib/reserve-allocation-intelligence/**`

| Where | What it does today | What it does NOT do |
|------|--------------------|---------------------|
| `lib/reserve-allocation-intelligence/pressure.ts` → `buildReservePressureFactors(...)` + `reservePressureScore` | Builds factor list and integer pressure score from forecast + goals + automation rules + savings rules + discretionary spend. | No factor for **bill-cluster pressure** (multiple OUTFLOWs landing within a single tight window). |
| `lib/reserve-allocation-intelligence/snapshot.ts` → `buildReserveAndContractorIntelligenceBundle(userId)` | Centralized single-forecast bundle used by `/api/operational-center/alerts`. | Hub bundle is the natural place to also build the timing snapshot once (avoid third forecast call). |

---

## 5. Existing operational-actions system

| Where | What it does today | What it does NOT do |
|------|--------------------|---------------------|
| `lib/operational-actions/types.ts` → `OperationalActionKind = 'PAUSE_AUTOMATION_RULE' \| 'RECORD_GOAL_CONTRIBUTION' \| 'EXTEND_GOAL_TARGET_DATE'` | Three deterministic, user-approved action kinds. | **No timing-shift action kind.** Adding `SHIFT_RECURRING_BILL_DATE` (write to `RecurringBill.nextDueDate`) and `PREPARE_RESERVE_FOR_OBLIGATION` (records a financial event + opens guidance) is the cleanest extension that respects the existing fingerprint / preview / apply pipeline. |
| `lib/operational-actions/preview.ts`, `apply.ts`, `fingerprint.ts`, `live-fingerprint.ts`, `build-proposals.ts` | Deterministic preview → user-approved apply with stale-fingerprint protection. | Already proven pattern — re-use, don't fork. |
| `lib/operational-actions/apply.ts` (v3, just shipped) | Persists `forecastSummaryBefore` / `forecastSummaryAfter` in `OPERATIONAL_FINANCIAL_ACTION_APPLIED.metadata`. | Already there — timing actions inherit balance-delta visibility for free. |

---

## 6. Existing workflow-resolution & notifications

| Where | What it does today | What it does NOT do |
|------|--------------------|---------------------|
| `lib/workflow-resolution/aggregate.ts` → `aggregateAppliedActions(events)` | Aggregates `OPERATIONAL_FINANCIAL_ACTION_APPLIED` by `OperationalActionKind` with USD deltas. | Will pick up new timing kinds automatically — provided we add them to `OperationalActionKind`. |
| `lib/operational-notifications/dedupe-key.ts` | Prefixes already supported: `cashflow_`, `guidance_`, `operational_action_`, `contractor_ops_`, `reserve_alloc_ops_`. | **No `timing_*` prefix** — must add for `timing_obligation_cluster`, `timing_payout_conflict`, `timing_reserve_prep_due`. |
| `lib/operational-notifications/enrich.ts` → `inferDomain(...)` | Maps prefixes to UI domain. | Must map new `timing_*` prefix to `financial` domain. |
| `app/api/operational-center/alerts/route.ts` | Calls `buildReserveAndContractorIntelligenceBundle` then `ensure*` per layer. | Must call `ensureTimingCoordinationAttentionNotifications` with cached snapshot — must not re-fetch the forecast a third time. |

---

## 7. Existing explainability systems

| Where | What it does today | What it does NOT do |
|------|--------------------|---------------------|
| Forecast `explain: { assumptions, inputsUsed }` | Audit trail for forecast inputs. | New layer must add per-snapshot `explain.assumptions` describing cluster threshold, conflict window, pressure scoring (mirroring reserve-allocation-intelligence pattern). |
| Operational action proposals carry `OperationalActionExplainDto { why, dataInfluences, calculations, expectedImpact }` | Per-action explainability. | New `SHIFT_RECURRING_BILL_DATE` and `PREPARE_RESERVE_FOR_OBLIGATION` proposals must carry the same shape. |

---

## 8. Existing Money Control / scheduling pages

| Where | What it does today | What it does NOT do |
|------|--------------------|---------------------|
| `app/(...)/money-control/**` | Rule / allocation UI. | No bill-timing UI; no calendar view of upcoming obligations. |
| `app/api/cron/**` | Only `cleanup` + `update-trials`. | **No timing cron.** All "ensure" runs synchronously inside `/api/operational-center/alerts` GET — same posture for the timing layer. |

---

## 9. Existing calendar / Google Calendar / external sync

**None.**

- No `lib/calendar/**`
- No `lib/google/**` / `googleapis` dependency
- No `app/api/calendar/**`
- No `GOOGLE_CALENDAR_*` env var
- `components/ui/calendar.tsx` is a `react-day-picker` date-picker primitive only

This is a greenfield surface inside a brownfield app — every adjacent system has to be wired in deliberately.

---

## 10. Duplication risks

| Risk | Why it exists | Mitigation |
|------|---------------|-----------|
| **Third forecast call per hub refresh** | `buildCashFlowForecast` is already called once in `alerts/route.ts` and threaded into contractor + reserve via `buildReserveAndContractorIntelligenceBundle`. A naive `buildTimingCoordinationSnapshot(userId)` would call it again. | Extend the bundle to also produce the timing snapshot from the **same** `forecast` instance. |
| **Re-detecting recurring patterns** | `detectRecurringPatterns` already runs inside `buildCashFlowForecast`. | Re-use forecast `events[]` for clustering; do not re-detect from raw transactions. |
| **Duplicate cadence math** | `lib/cashflow/forecast.ts` and `lib/cashflow/recurrence.ts` already fork cadence helpers. | New layer **must not** introduce a third cadence helper. Cluster detection reads `forecast.events`, period. |
| **Duplicate scheduling engine** | Tempting to write a "schedule events for the next 90 days" cron. | Forbidden by production rules. Calendar view is a *projection* of the existing forecast; nothing schedules anything new. |
| **Stale RecurringBill writers** | `lastTriggeredAt`, `autopayEnabled`, `reminderDaysBefore` look writable but are abandoned today. | New layer reads `nextDueDate` + `frequency` + `amount` only. `SHIFT_RECURRING_BILL_DATE` writes **only** `nextDueDate`. |

---

## 11. Missing timing-coordination workflows

| Capability | Status today |
|-----------|--------------|
| Obligation cluster detection (≥ K outflows within N days) | **Missing.** |
| Payout vs. bill overlap scoring (paycheck arrives N days too late) | **Missing.** |
| Forecast instability window (sequence of consecutive days in `low < threshold`) | **Missing.** |
| Contractor payout cluster (multiple jobs / invoices peaking in same week) | **Missing.** |
| Reserve preparation guidance ("fund reserve N days before cluster X") | **Missing.** |
| Timing-aware operational actions (`SHIFT_RECURRING_BILL_DATE`, `PREPARE_RESERVE_FOR_OBLIGATION`) | **Missing.** |
| Calendar visualisation of forecast events | **Missing.** |
| Interactive drag-and-drop to *propose* a date shift (via existing operational-actions pipeline, never autonomously) | **Missing.** |
| Google Calendar connection (subscribable ICS feed) | **Missing.** |
| Per-event "Add to Google Calendar" deep link | **Missing.** |

---

## 12. Recommended operational architecture (preview — full detail in Phase 2 doc)

1. **`lib/timing-coordination/`** (new):
   - `types.ts` — DTOs (`TimingCoordinationSnapshotDto`, `ObligationClusterDto`, `TimingPressureFactorDto`, `TimingCalendarEntryDto`).
   - `clusters.ts` (pure) — `detectObligationClusters(events, opts)`, `detectPayoutBillConflicts(events, opts)`, `detectInstabilityWindow(daily)`.
   - `pressure.ts` (pure) — `buildTimingPressureFactors`, `timingPressureScore`.
   - `guidance.ts` (pure) — `buildTimingGuidance` (rows linking to Money Control, reserve goal pages, operational-action previews).
   - `snapshot.ts` — `buildTimingCoordinationSnapshot(userId, { forecast?, contractor?, reserve? })`.
   - `ensure-attention.ts` — `ensureTimingCoordinationAttentionNotifications` writing `timing_*` notifications idempotently.
   - `ics-feed.ts` (pure) — `buildIcsFeed(entries, opts)` deterministic RFC 5545 output.
   - `feed-token.ts` — HMAC-signed token (no DB migration); `verifyFeedToken(...)` for the public ICS URL.

2. **APIs** (new):
   - `GET /api/operational-center/timing-coordination` — snapshot for the workspace panel.
   - `GET /api/operational-center/timing-coordination/calendar?from=&to=` — JSON calendar feed for the in-app calendar UI (forecast events + invoice rows + goal rows).
   - `POST /api/operational-center/timing-coordination/shift-bill` — turns a drag-and-drop into a `SHIFT_RECURRING_BILL_DATE` proposal-as-attention (no autonomous write).
   - `GET /api/timing-coordination/calendar.ics?token=…` — public RFC 5545 feed Google Calendar can subscribe to; HMAC-verified per user.

3. **`lib/operational-actions`** (extended):
   - Add `SHIFT_RECURRING_BILL_DATE` to `OperationalActionKind`.
   - Add `PREPARE_RESERVE_FOR_OBLIGATION` (records a `FinancialEvent`, no money moves, no transaction created).
   - Extend `fingerprint.ts`, `live-fingerprint.ts`, `preview.ts`, `apply.ts` (single switch case each) — re-uses the entire existing approval pipeline. **`build-proposals.ts` is untouched**; drag-and-drop creates the AutomationNotification directly via the new POST API.

4. **`lib/operational-notifications`** (extended):
   - `dedupe-key.ts` — add `timing_*` prefix mapping.
   - `enrich.ts` — map `timing_*` to `financial` UI domain.

5. **`app/api/operational-center/alerts/route.ts`** (extended):
   - Bundle now also produces `timing`; passes the cached snapshot into `ensureTimingCoordinationAttentionNotifications`.

6. **UI** (new):
   - `components/operational-workspace/TimingCoordinationPanel/` — pressure score + factors + clusters + guidance (text only, links to Money Control, Cash Flow, Operational Goals).
   - `components/operational-workspace/FinancialTimingCalendar/` — interactive monthly grid (Tailwind, no new heavy dep), with native HTML5 drag-and-drop on bill events. Drop opens a confirm dialog that calls `shift-bill` to create a proposal; user still has to preview + apply in the existing pipeline. Per-event "Add to Google Calendar" anchor (uses `https://calendar.google.com/calendar/render?...` query format — no OAuth, no token storage). "Subscribe in Google Calendar" button copies the ICS feed URL.

7. **Workspace integration**:
   - `UnifiedOperationalWorkspace` embeds `TimingCoordinationPanel` after `WorkflowResolutionPanel`, then `FinancialTimingCalendar`.

---

## 13. Safe implementation strategy

1. **Pure-first.** Implement `clusters.ts`, `pressure.ts`, `guidance.ts`, `ics-feed.ts`, `feed-token.ts` as pure modules with no Prisma imports, fully unit-testable without the database.
2. **One forecast.** Extend the existing reserve+contractor bundle to also emit the timing snapshot from the same `forecast` instance.
3. **Idempotent attention.** `ensureTimingCoordinationAttentionNotifications` keys on `dedupeKey = timing:<reason>:<ymd>` so re-runs update one row rather than spam.
4. **No autonomous writes.** Drag-and-drop never mutates a `RecurringBill`. It only creates a `SHIFT_RECURRING_BILL_DATE` proposal as an `AutomationNotification`. The existing preview/apply approval flow is the only mutation path.
5. **No new cron.** Same posture as the rest of the operational center — recompute on workspace pull.
6. **ICS over OAuth.** Primary Google Calendar connection is a **signed read-only ICS subscription URL**, which Google Calendar already supports natively. No `googleapis` dependency, no token storage, no new Prisma model, no migration. Per-event "Add to Google" is just a deep link.
7. **Explainability.** Snapshot `explain.assumptions` and `explain.inputsUsed`; per-action `OperationalActionExplainDto`; per-cluster `reasoning[]`.
8. **Determinism.** Cluster bands and pressure scoring are integer-thresholded; tie-breaks are stable (date ascending, then label, then referenceId).
9. **Backward compatible.** No schema migration in this phase. `SHIFT_RECURRING_BILL_DATE` writes only the already-existing `RecurringBill.nextDueDate` column.

---

## 14. Phase 1 conclusion

The codebase has:
- A rich per-day forecast event stream (`CashflowEventDto[]`) ready to be projected onto a calendar.
- A proven operational-actions approval pipeline that extends cleanly to a timing-shift action.
- A bundle pattern in the alerts route that lets us share one forecast across contractor + reserve + timing without re-computing.
- **Zero pre-existing calendar UI and zero Google Calendar integration** — no duplication risk on the visualisation surface.

The Phase 2 architecture doc will formalise: cluster thresholds, pressure scoring, action payloads, calendar API shape, ICS feed token format, and drag-and-drop UX contract.
