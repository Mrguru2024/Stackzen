# Financial timing coordination & calendar intelligence — architecture (Phase 2)

This document specifies the deterministic timing-coordination layer that ships in Phase 3. Every capability is constrained by the rules in the audit doc — in particular:

- Not a generic calendar. **Operational financial timing infrastructure.**
- No autonomous money movement, no autonomous date changes.
- All mutations route through the existing `lib/operational-actions/*` preview/apply pipeline.
- Single forecast per hub refresh (extends the existing bundle).
- ICS-based Google Calendar connection; no OAuth, no token storage in the database, no `googleapis` dependency.

---

## 1. Principles

1. **Deterministic.** Cluster thresholds, conflict windows and pressure scoring are integer-thresholded with stable tie-breaks. The same inputs always produce the same output.
2. **Reuse.** Reads only from `buildCashFlowForecast`, `Invoice`, `RecurringBill`, `OperationalGoal`+`SmartBucket`, `Job`, `AutomationNotification`. No new ORM model, no migration.
3. **Pull-only.** Snapshot is computed when the workspace pulls. No new cron. `ensureTimingCoordinationAttentionNotifications` is idempotent.
4. **No autonomous side-effects.** Drag-and-drop creates a *proposal*. Approval still flows through `OperationalActionPreview` → `OperationalActionApply`.
5. **Explainability is mandatory.** Every factor, cluster, and proposed action carries `reasoning[]` / `OperationalActionExplainDto`.
6. **No fake reminders.** No bell push, no email, no badge — attention rows go into the existing operational queue and are deduped + enriched by the existing helpers.

---

## 2. Obligation cluster detection

A **cluster** is `≥ MIN_CLUSTER_SIZE` outflow-direction `CashflowEventDto` rows whose `date` values fall within a sliding `BAND_DAYS` window, whose summed `amount` exceeds `MIN_CLUSTER_AMOUNT_USD`.

| Constant | Default | Rationale |
|---------|---------|-----------|
| `MIN_CLUSTER_SIZE` | `3` | Two outflows in one day is normal; three+ is a "cluster". |
| `BAND_DAYS` | `5` | A workweek-ish window matches paycheck cadence. |
| `MIN_CLUSTER_AMOUNT_USD` | `200` | Filters out micro-bills that don't operationally matter. |
| `MAX_CLUSTERS_REPORTED` | `5` | Caps the snapshot size; deterministic sort by `(startDate ASC, totalAmount DESC, id ASC)`. |

Pure module: `lib/timing-coordination/clusters.ts`

```ts
export function detectObligationClusters(
  events: CashflowEventDto[],
  opts?: { minSize?: number; bandDays?: number; minAmountUsd?: number; max?: number }
): ObligationClusterDto[]
```

Algorithm:
1. Filter to outflow events (`recurring_bill`, `detected_obligation`) from the 30-day window.
2. Sort by date ascending.
3. Two-pointer sliding window of `BAND_DAYS`: for each starting event, extend right while remaining events fit. Emit if `size ≥ MIN_CLUSTER_SIZE` and `sum(amount) ≥ MIN_CLUSTER_AMOUNT_USD`.
4. Suppress overlapping clusters: keep the **earliest** start; subsequent clusters must start *after* the previous cluster's last event date.
5. Cap to `MAX_CLUSTERS_REPORTED`.

Output:

```ts
export interface ObligationClusterDto {
  id: string;              // sha-style hash of startDate|labels for dedupe
  startDate: string;       // ISO date of first event
  endDate: string;         // ISO date of last event
  bandDays: number;        // = endDate - startDate (inclusive)
  totalAmountUsd: number;  // sum of event amounts
  events: ObligationClusterEventDto[];
  reasoning: string[];
}
```

---

## 3. Payout vs. bill timing conflict

A **conflict** is detected when, inside the 14-day window, the sum of OUTFLOW events on calendar day `d` exceeds the **cumulative** INFLOW total through day `d`.

Pure helper: `detectPayoutBillConflicts(events, opts?)`:

| Constant | Default |
|---------|---------|
| `CONFLICT_WINDOW_DAYS` | `14` |
| `MIN_CONFLICT_DEFICIT_USD` | `100` |

Emits `PayoutBillConflictDto[]` ordered by `(date ASC, deficitUsd DESC)`. Each row carries:

```ts
interface PayoutBillConflictDto {
  date: string;              // first day of deficit
  deficitUsd: number;        // |cumulative outflow - cumulative inflow|
  precedingInflowUsd: number;
  outflowOnDayUsd: number;
  reasoning: string[];
}
```

This is a deterministic ledger-side conflict; it is **not** a real cash-out risk on its own (the starting balance can absorb it). It is one input to the pressure score, alongside `PROJECTED_LOW_BALANCE`.

---

## 4. Forecast instability window

Reuses the 30-day daily series (`forecast.windows[2].daily`). Computes the longest run of consecutive days where `balance < startingBalance × INSTABILITY_FRACTION`.

| Constant | Default |
|---------|---------|
| `INSTABILITY_FRACTION` | `0.25` |
| `MIN_INSTABILITY_DAYS` | `3` |

Emits `ForecastInstabilityWindowDto | null`.

---

## 5. Timing pressure scoring

Pure module: `lib/timing-coordination/pressure.ts`.

Score = `factors.length`. Factors are *additive*, never inferred from a single metric, and never produce a "health score".

| Factor code | Fires when |
|------------|-----------|
| `OBLIGATION_CLUSTER_PRESENT` | `detectObligationClusters(...).length ≥ 1` |
| `OBLIGATION_CLUSTER_DENSE` | Top cluster has `totalAmountUsd > startingBalance × 0.30` |
| `PAYOUT_BILL_CONFLICT` | `detectPayoutBillConflicts(...).length ≥ 1` |
| `FORECAST_INSTABILITY_WINDOW` | `detectInstabilityWindow(...) !== null` |
| `RESERVE_PREP_BEHIND_CLUSTER` | A cluster exists in `≤ 7 days` and `OperationalGoal.goalKind in {EMERGENCY_FUND, TAX_RESERVE}` has progress `< 50%`. |
| `CONTRACTOR_PAYOUT_OVERLAP` | `≥ 2 OUTFLOW` from `kind in ('recurring_bill','detected_obligation')` overlap with a contractor invoice `INFLOW` window where `daysPastDue > 0` exists (uses contractor snapshot late-payer client list). |

`isElevatedTimingPressure(score, ctx)` returns true when score ≥ 3 OR `OBLIGATION_CLUSTER_DENSE` is present OR `RESERVE_PREP_BEHIND_CLUSTER` is present. The elevated boolean drives `ensureTimingCoordinationAttentionNotifications`.

---

## 6. Guidance

`buildTimingGuidance(snapshot)` produces read-only `TimingGuidanceRowDto[]`. Each row has a `code`, `title`, `body`, and one or more `links` to Money Control, Cash Flow, Operational Goals, or operational-action previews. **No row mutates state.**

| Code | Triggered by | Suggested links |
|------|-------------|----------------|
| `DELAY_DISCRETIONARY_ALLOCATION` | `PAYOUT_BILL_CONFLICT` | Money Control · allocations, Cash flow |
| `PREPARE_RESERVE_BUFFER` | `RESERVE_PREP_BEHIND_CLUSTER` | Operational goals (deep-linked to top-underfilled reserve) |
| `SLOW_LOW_PRIORITY_GOAL` | `OBLIGATION_CLUSTER_DENSE` | Operational goals |
| `SHIFT_TO_AVOID_CLUSTER` | top cluster contains ≥ 1 `kind='recurring_bill'` row | Per-event "Propose shift" CTA on calendar |
| `CONTRACTOR_TIGHTEN_DEPOSIT_TIMING` | `CONTRACTOR_PAYOUT_OVERLAP` | Jobs · contractor ops |

---

## 7. Snapshot

```ts
export interface TimingCoordinationSnapshotDto {
  generatedAt: string;
  pressureScore: number;            // 0..6 (factor count)
  factors: TimingPressureFactorDto[];
  clusters: ObligationClusterDto[];
  conflicts: PayoutBillConflictDto[];
  instabilityWindow: ForecastInstabilityWindowDto | null;
  reservePrepGoals: ReservePrepGoalRefDto[];
  guidance: TimingGuidanceRowDto[];
  /** Calendar projection: dedup'd 30d forecast events with stable ids. */
  calendarEntries: TimingCalendarEntryDto[];
  explain: {
    assumptions: string[];
    inputsUsed: Record<string, number | string>;
  };
}
```

Producer: `buildTimingCoordinationSnapshot(userId, opts?)` where `opts` accepts an already-computed `forecast`, `contractor`, and `reserve` snapshot. Default behaviour (no opts) calls `buildReserveAndContractorIntelligenceBundle(userId)` internally to get all three at once — exactly the same pattern reserve already uses.

The hub `buildReserveAndContractorIntelligenceBundle` is extended to also return `timing`, so the alerts route builds **one** forecast for **four** layers.

---

## 8. Calendar entry projection

`TimingCalendarEntryDto` is the canonical shape consumed by the calendar UI and the ICS feed.

```ts
export interface TimingCalendarEntryDto {
  id: string;                       // stable per (kind, referenceId, dateYmd)
  date: string;                     // ISO date (day-precision)
  kind: CashflowEventDto['kind']
      | 'goal_target'               // OperationalGoal.targetDate
      | 'invoice_due'               // Invoice.dueDate
      | 'job_deposit_required';     // Job.expectedDepositDueAt (if present) — currently informational
  direction: 'INFLOW' | 'OUTFLOW' | 'NEUTRAL';
  label: string;
  amountUsd: number | null;         // null for NEUTRAL entries
  referenceIds: string[];           // ledger / db ids for traceability
  clusterId: string | null;         // if part of a cluster
  shiftable: boolean;               // true only when referenceIds[0] is a writable RecurringBill.id
  reasoning: string[];
}
```

`buildCalendarEntries(forecast, invoices, goals)` (pure) returns the de-duped list sorted by `(date ASC, label ASC)`. It uses **only the 30-day window** (`forecast.windows[2].events`) to avoid the duplicates across 7/14/30 windows discovered in the audit.

---

## 9. API surface

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/operational-center/timing-coordination` | GET | Returns the snapshot. `ensure=1` query also writes attention notifications. |
| `/api/operational-center/timing-coordination/calendar` | GET | Same snapshot but only the `calendarEntries` and the `clusters` list — supports `?from=YYYY-MM-DD&to=YYYY-MM-DD` clamping to a month view. |
| `/api/operational-center/timing-coordination/shift-bill` | POST | Body: `{ billId: string, proposedDate: string }`. Creates an `AutomationNotification` with a `SHIFT_RECURRING_BILL_DATE` proposal. Returns the notification id. |
| `/api/timing-coordination/calendar.ics` | GET | Public ICS feed. Requires `?token=` HMAC-signed userId. Read-only; no auth cookies needed (so Google Calendar can subscribe). |
| `/api/timing-coordination/calendar-feed-token` | POST | Authenticated; returns the user's signed token. |

All three center routes use `requireAuthSession` and scope every Prisma read to `userId`. The public ICS route validates the signed token against a server secret and 404s on bad/missing/expired tokens.

---

## 10. New `OperationalActionKind` values

Two additions to `lib/operational-actions/types.ts`:

```ts
export type OperationalActionKind =
  | 'PAUSE_AUTOMATION_RULE'
  | 'RECORD_GOAL_CONTRIBUTION'
  | 'EXTEND_GOAL_TARGET_DATE'
  | 'SHIFT_RECURRING_BILL_DATE'           // ⟵ new
  | 'PREPARE_RESERVE_FOR_OBLIGATION';     // ⟵ new
```

### 10.1 `SHIFT_RECURRING_BILL_DATE`

| Field | Source |
|------|--------|
| `payload.billId` | `RecurringBill.id` |
| `payload.previousDate` | `RecurringBill.nextDueDate` (ISO) |
| `payload.proposedDate` | requested ISO date |
| `payload.amount` | `RecurringBill.amount` (informational, never written) |
| `fingerprint` | `sha("SHIFT_RECURRING_BILL_DATE", forecastGeneratedAt, billId, proposedDateYmd)` |

`preview` rebuilds the forecast with a temporary `nextDueDate` swap (in-memory clone of the recurring bill list passed to a forecast helper — no DB write) and returns the existing `forecastSummaryBefore` + a deterministic `notes[]` narrative.

`apply` re-checks the live fingerprint, then `prisma.recurringBill.update({ where: { id }, data: { nextDueDate: new Date(proposedDate) } })` inside a transaction with `recordingFinancialEventSafe('RECURRING_BILL_UPDATED', ...)`. **Only the `nextDueDate` column is written.** No money moves.

### 10.2 `PREPARE_RESERVE_FOR_OBLIGATION`

| Field | Source |
|------|--------|
| `payload.goalId` | targeted reserve goal |
| `payload.clusterId` | `ObligationClusterDto.id` |
| `payload.targetAmount` | suggested reserve increment (≥ 25, ≤ 500) |

`apply` does NOT move money. It records a `FinancialEvent` of type `OPERATIONAL_FINANCIAL_ACTION_APPLIED` with metadata `{ kind, payload, forecastSummaryBefore, forecastSummaryAfter, prepIntent: true }`. This is intentional: the operational signal is "user committed to prepare reserve X by date Y"; the actual contribution still goes through `RECORD_GOAL_CONTRIBUTION` when the user decides to fund it.

---

## 11. Drag-and-drop UX contract

1. The calendar renders one `TimingCalendarEntryDto` per cell.
2. Only entries with `shiftable === true` are HTML5-draggable (`draggable={true}`).
3. Dropping on a future day cell opens a confirmation dialog:
   - Shows: "Move *Rent* from 2026-06-01 → 2026-06-04".
   - Buttons: "Cancel" and "Create proposal".
4. "Create proposal" POSTs `/api/operational-center/timing-coordination/shift-bill`. The response is a notification id.
5. The dialog then navigates to the existing operational-actions preview using that notification id. **No `RecurringBill` row is changed yet.**
6. The user previews and applies inside the existing pipeline. Only the apply step writes to the database.

This contract guarantees: zero autonomous side-effect from drag, full explainability inherited from the existing preview, full audit via `OPERATIONAL_FINANCIAL_ACTION_APPLIED`.

---

## 12. Calendar UI

`components/operational-workspace/FinancialTimingCalendar/`:

- Tailwind-only, dark-mode-ready, mobile-responsive.
- Server-component shell + small client island that owns drag-drop state and the confirm dialog.
- Month grid built from `date-fns` (`startOfMonth`, `eachDayOfInterval`, etc) — no new dependency.
- Per-event chip color by direction: emerald (INFLOW), amber (OUTFLOW), slate (NEUTRAL).
- Cluster-day border highlight derived from `cluster.startDate`..`cluster.endDate`.
- Day-cell footer aggregates: `+$X` inflow / `–$Y` outflow.
- Bottom row of the day cell carries the "Add to Google" anchor per event:
  ```
  https://calendar.google.com/calendar/render?action=TEMPLATE
    &text=<label>
    &dates=<YYYYMMDD>/<YYYYMMDD>
    &details=<reasoning + StackZen link>
  ```
- "Subscribe in Google Calendar" button reveals the ICS subscription URL.
- Keyboard accessible: arrow keys move focus across day cells; `Enter` opens event details; `Space` starts drag (with a visible "moving …" indicator); arrow keys move; `Enter` drops; `Escape` cancels.

---

## 13. ICS feed (Google Calendar connection)

Pure module `lib/timing-coordination/ics-feed.ts`:

```ts
export function buildIcsFeed(entries: TimingCalendarEntryDto[], opts: {
  feedName: string;
  feedUrl: string;
}): string
```

Spec:

- One `VEVENT` per entry. `DTSTART` / `DTEND` are `VALUE=DATE` (all-day).
- `UID` = `entry.id + '@stackzen'`.
- `SUMMARY` includes direction emoji-free prefix: `[+] Paycheck`, `[-] Rent`, `[ ] Goal target`.
- `DESCRIPTION` carries reasoning + amount + ledger reference ids.
- `CATEGORIES` includes the original `kind` and `StackZen Timing`.
- `STATUS:CONFIRMED`, `TRANSP:TRANSPARENT` (read-only informational).
- Top-level `X-WR-CALNAME` = feed name, `X-PUBLISHED-TTL:PT1H`.

`lib/timing-coordination/feed-token.ts`:

```ts
export function signFeedToken(userId: string, secret: string, ttlSec: number): string
export function verifyFeedToken(token: string, secret: string): { userId: string } | null
```

Uses Node `crypto` HMAC-SHA256 over `userId.expiresAt`, base64url-encoded — zero new dependency. Token TTL defaults to 180 days; users can rotate by requesting a new one.

The public `GET /api/timing-coordination/calendar.ics?token=...` route:
1. Verifies the token.
2. Loads the same `TimingCoordinationSnapshotDto` for that user.
3. Returns `Content-Type: text/calendar; charset=utf-8`, `Cache-Control: public, max-age=900`.

**Required env var:** `STACKZEN_FEED_TOKEN_SECRET` — checked at request time; if missing, the route returns 503 so we never accidentally ship unsigned feeds.

---

## 14. Attention notifications

`ensureTimingCoordinationAttentionNotifications(userId, snap?)`:

| Attention kind | Condition |
|---------------|-----------|
| `timing_obligation_cluster_dense` | `isElevatedTimingPressure` AND top cluster is dense |
| `timing_reserve_prep_due` | `RESERVE_PREP_BEHIND_CLUSTER` factor present |
| `timing_payout_conflict` | `PAYOUT_BILL_CONFLICT` factor present |

- Dedupe key `timing:<reason>:<ymd>` — same date in same reason updates the existing row in place.
- `metadata.timingCoordination` carries: `clusters[]` ids, `conflicts[]` dates, `factorCodes`, `pressureScore`.
- Severity rules: `WARNING` for `obligation_cluster_dense` / `reserve_prep_due`; `INFO` for `payout_conflict`.

The new prefix is added to `lib/operational-notifications/dedupe-key.ts` (`timing_` → `risk:` style mapping) and `lib/operational-notifications/enrich.ts` (`timing_` → `financial` domain).

---

## 15. Explainability per snapshot

```ts
explain.assumptions:
- "Cluster detection uses BAND_DAYS=5, MIN_CLUSTER_SIZE=3, MIN_CLUSTER_AMOUNT_USD=200 from the 30-day forecast OUTFLOW events only — no transaction re-detection."
- "Payout-bill conflict compares cumulative INFLOW vs cumulative OUTFLOW per day for the first 14 days; deficit ≥ $100 is reported."
- "Instability window is the longest consecutive run of days with projected balance below 25% of starting balance, minimum 3 days."
- "Reserve-prep factor only fires when a cluster falls within 7 days AND a reserve goal exists with <50% progress."
- "Calendar entries are taken only from the 30-day forecast window to avoid duplication across the 7/14/30 windows."
- "Pressure score is factor count; not a percentage, not a health score."

explain.inputsUsed:
- forecastGeneratedAt
- clusterCount, conflictCount, instabilityDays
- reservePrepGoalCount, contractorLatePayerClientCount
- bandDays, minClusterSize, minClusterAmountUsd, conflictWindowDays, instabilityFraction
```

---

## 16. What this layer does NOT do

- It does not implement a generic calendar app or arbitrary event entry. Every event has an upstream ledger reason.
- It does not run a cron, schedule webhooks, or send reminders. The workspace queue is the only surface.
- It does not store Google Calendar tokens. The connection is a signed ICS subscription URL.
- It does not move money. Drag-and-drop only proposes; apply is user-approved.
- It does not invent a new ledger or scheduling engine. All projections come from `buildCashFlowForecast`.
- It does not produce a "timing health score". `pressureScore` is the integer count of factors that fired.

---

## 17. Phase 3 implementation order

1. `lib/timing-coordination/types.ts`
2. `lib/timing-coordination/clusters.ts` (+ test)
3. `lib/timing-coordination/pressure.ts` (+ test)
4. `lib/timing-coordination/guidance.ts`
5. `lib/timing-coordination/calendar-entries.ts` (+ test)
6. `lib/timing-coordination/ics-feed.ts` (+ test)
7. `lib/timing-coordination/feed-token.ts` (+ test)
8. `lib/timing-coordination/snapshot.ts`
9. `lib/timing-coordination/ensure-attention.ts`
10. Extend `lib/operational-actions/*` for `SHIFT_RECURRING_BILL_DATE` + `PREPARE_RESERVE_FOR_OBLIGATION`
11. `lib/operational-notifications/dedupe-key.ts` + `enrich.ts`
12. Extend `lib/reserve-allocation-intelligence/snapshot.ts` bundle to return `timing`
13. APIs (snapshot + calendar + shift-bill + ICS + token)
14. UI: `TimingCoordinationPanel`, `FinancialTimingCalendar`
15. Embed in `UnifiedOperationalWorkspace`
16. Validation + completion report
