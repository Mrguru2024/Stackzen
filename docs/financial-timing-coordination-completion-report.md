# Financial timing coordination & calendar intelligence — completion report (Phase 5)

## Spec delivery checklist (Phases 1–5)

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 1 | `docs/financial-timing-coordination-audit.md` (existing systems, duplication risks, gaps, strategy) | Done |
| 2 | `docs/financial-timing-coordination-architecture.md` (deterministic design, no autonomous moves) | Done |
| 3 | Lib (clusters, pressure, calendar entries, ICS feed, signed feed token, snapshot, ensure-attention), 5 APIs, 2 UI panels (timing + interactive calendar), 2 new `OperationalActionKind` values, hub bundle wired, workspace integration | Done |
| 4 | `npx prisma validate` ✅, `npm run typecheck` ✅, `npx jest lib/timing-coordination` 31 / 31, `npx jest components/operational-workspace/TimingCoordinationPanel` 1 / 1, regression-checked operational-actions, reserve-allocation-intelligence (22/23 — pre-existing TZ test fail unrelated), cashflow, contractor-operations | Done |
| 5 | This completion report | Done |

**Interpretation:** "Calendar intelligence" is **operational financial timing infrastructure** — cluster detection, payout-vs-bill conflicts, forecast instability windows, reserve-prep guidance, and drag-and-drop *proposals* (never autonomous mutations). It is **not** a generic calendar app, not passive reminders, not disconnected due-date tracking.

---

## Files added

| Path | Purpose |
|------|---------|
| `docs/financial-timing-coordination-audit.md` | Phase 1 audit |
| `docs/financial-timing-coordination-architecture.md` | Phase 2 design |
| `docs/financial-timing-coordination-completion-report.md` | This report |
| `lib/timing-coordination/types.ts` | Snapshot DTOs (factors, clusters, conflicts, instability window, calendar entries) |
| `lib/timing-coordination/clusters.ts` | `detectObligationClusters` / `detectPayoutBillConflicts` / `detectInstabilityWindow` — pure |
| `lib/timing-coordination/pressure.ts` | `buildTimingPressureFactors`, `timingPressureScore`, `isElevatedTimingPressure`, `buildTimingGuidance` — pure |
| `lib/timing-coordination/calendar-entries.ts` | `buildCalendarEntries` deterministic projection of forecast + invoices + goal targets — pure |
| `lib/timing-coordination/ics-feed.ts` | `buildIcsFeed` (RFC 5545 read-only) + `buildAddToGoogleCalendarUrl` — pure |
| `lib/timing-coordination/feed-token.ts` | `signFeedToken` / `verifyFeedToken` HMAC-SHA256 (no DB row) |
| `lib/timing-coordination/snapshot.ts` | `buildTimingCoordinationSnapshot` + `buildTimingCoordinationSnapshotFromForecast` for the hub bundle |
| `lib/timing-coordination/ensure-attention.ts` | `ensureTimingCoordinationAttentionNotifications` — idempotent `timing_obligation_cluster_dense` notification |
| `lib/timing-coordination/__tests__/clusters.test.ts` | Cluster, conflict, and instability detection tests |
| `lib/timing-coordination/__tests__/pressure.test.ts` | Factor + guidance gating tests |
| `lib/timing-coordination/__tests__/calendar-entries.test.ts` | Projection + cluster tagging + shiftability tests |
| `lib/timing-coordination/__tests__/ics-feed.test.ts` | RFC 5545 wrapper, escaping, prefix tests |
| `lib/timing-coordination/__tests__/feed-token.test.ts` | HMAC sign/verify/tamper/expiry tests |
| `app/api/operational-center/timing-coordination/route.ts` | GET snapshot + optional ensure |
| `app/api/operational-center/timing-coordination/calendar/route.ts` | GET calendar entries clamped by `from`/`to` |
| `app/api/operational-center/timing-coordination/shift-bill/route.ts` | POST drag-and-drop → `SHIFT_RECURRING_BILL_DATE` proposal (no autonomous write) |
| `app/api/operational-center/timing-coordination/feed-token/route.ts` | POST authenticated; mints user's signed feed URL |
| `app/api/timing-coordination/calendar.ics/route.ts` | Public, HMAC-verified, read-only RFC 5545 feed (Google Calendar / iCal subscribable) |
| `components/operational-workspace/TimingCoordinationPanel/index.tsx` | Workspace panel: pressure score + factors + clusters + conflicts + instability + guidance |
| `components/operational-workspace/TimingCoordinationPanel/TimingCoordinationPanel.test.tsx` | Panel Jest test |
| `components/operational-workspace/FinancialTimingCalendar/index.tsx` | Interactive monthly calendar (drag-and-drop, per-event "Add to Google" deep link, ICS subscription URL) |

## Files changed

| Path | Change |
|------|--------|
| `lib/operational-actions/types.ts` | Added `SHIFT_RECURRING_BILL_DATE` and `PREPARE_RESERVE_FOR_OBLIGATION` to `OperationalActionKind`; added two payload types and two preview fields. |
| `lib/operational-actions/fingerprint.ts` | Added `fingerprintForShiftBill` + `fingerprintForPrepareReserve` — same SHA-256 / sliced-hex pattern as the existing fingerprints. |
| `lib/operational-actions/live-fingerprint.ts` | Two new `case` arms re-using the new fingerprint helpers. |
| `lib/operational-actions/preview.ts` | Two new conditional preview branches (text-only `notes[]` extensions). |
| `lib/operational-actions/apply.ts` | `SHIFT_RECURRING_BILL_DATE` → writes only `RecurringBill.nextDueDate`; `PREPARE_RESERVE_FOR_OBLIGATION` → writes only the existing `OPERATIONAL_FINANCIAL_ACTION_APPLIED` event (no money moves, no schema change). |
| `lib/operational-notifications/dedupe-key.ts` | `timing_*` prefix mapped to `timing:<key>` for dedupe parity with other operational families. |
| `lib/operational-notifications/enrich.ts` | `timing_*` → `financial` UI domain. |
| `lib/reserve-allocation-intelligence/snapshot.ts` | Bundle now (a) requests `includeDetails: true` so timing-coordination can read the 30-day daily series without a second forecast call, and (b) returns `timing: TimingCoordinationSnapshotDto`. |
| `app/api/operational-center/alerts/route.ts` | Calls `ensureTimingCoordinationAttentionNotifications` with the bundle's cached `timing` snapshot — still one forecast per hub refresh. |
| `components/operational-workspace/UnifiedOperationalWorkspace/index.tsx` | Embeds `TimingCoordinationPanel` then `FinancialTimingCalendar` after `WorkflowResolutionPanel`. |

## Systems reused (no duplication)

- `buildCashFlowForecast` — single 30-day-with-details forecast per hub refresh, threaded through the reserve+contractor+timing bundle.
- `buildContractorFinancialOpsSnapshot` (`latePayerClients`) — feeds `CONTRACTOR_PAYOUT_OVERLAP` factor without a second contractor query.
- `RecurringBill.nextDueDate` — the only field `SHIFT_RECURRING_BILL_DATE` mutates. No schema flag, no new column.
- `OperationalGoal` + `SmartBucket` — reserve-prep candidates (`EMERGENCY_FUND` / `TAX_RESERVE` kinds at < 50% progress).
- `Invoice.dueDate` and `OperationalGoal.targetDate` — calendar projections only; never mutated by the calendar.
- `lib/operational-actions/*` — the existing fingerprint / preview / apply pipeline carries the two new kinds. **`build-proposals.ts` is untouched** — timing-shift proposals are user-initiated via drag-and-drop, not auto-built.
- `lib/operational-actions/apply.ts` v3 metadata persistence — both new kinds inherit forecast `Before` / `After` balance deltas on apply.
- `AutomationNotification` + `buildOperationalAttentionMetadata` + `createAutomationNotification` — same notification pattern; new `timing_obligation_cluster_dense` attentionKind family.
- `FinancialEvent` (`OPERATIONAL_FINANCIAL_ACTION_APPLIED`) — same event row covers both new action kinds for the workflow-resolution layer (no new `FinancialEventType` enum value).

## Duplicate systems avoided

- **No second forecast call** on the hub refresh path — the bundle's single `buildCashFlowForecast(..., { includeDetails: true })` feeds reserve + contractor + timing.
- **No second cadence helper** — clustering reads `forecast.events[]` only; the existing `normalizeBillFrequency` / `nextCadenceDate` / `rollBillStart` helpers are untouched.
- **No new ORM model** — no `CalendarIntegration` table, no token storage row. The Google Calendar connection is an HMAC-signed read-only ICS subscription URL.
- **No new cron** — same posture as the rest of the operational center: recompute on workspace pull.
- **No new `FinancialEventType` enum value** — `PREPARE_RESERVE_FOR_OBLIGATION` apply piggybacks on the existing `OPERATIONAL_FINANCIAL_ACTION_APPLIED` row with `metadata.kind`.
- **No autonomous date changes** — drag-and-drop opens a confirmation dialog; submission only creates a pending `AutomationNotification` proposal; the existing preview/apply approval flow is the **only** mutation path.

## Feature status

| Required capability | Status |
|---------------------|--------|
| Obligation cluster detection (large bills, reserve overlap, payout overlap) | `detectObligationClusters` (5-day band, ≥3 outflows, ≥$200, dense if > 30% starting balance) |
| Payout & bill coordination (paycheck vs bill, invoice/payment, subscription, reserve contributions) | `detectPayoutBillConflicts` (14-day cumulative deficit ≥ $100) |
| Forecast instability windows | `detectInstabilityWindow` (longest run < 25% of starting balance, ≥3 days) |
| Timing pressure guidance (delay discretionary, prepare reserve, slow goal, shift bill, contractor timing) | `buildTimingGuidance` rows linking to Money Control, operational goals, calendar, jobs |
| Timing action workflows (review pressure, preview adjustments, approve, understand consequences) | `SHIFT_RECURRING_BILL_DATE` + `PREPARE_RESERVE_FOR_OBLIGATION` proposals via existing `lib/operational-actions/*` pipeline |
| Explainability (timing conflict, overlap, expected impact, why risk increased) | Per-factor `reasoning[]`, snapshot `explain.assumptions` + `inputsUsed`, per-proposal `OperationalActionExplainDto`, per-calendar-entry `reasoning[]` |
| Operational workspace integration | `TimingCoordinationPanel` + `FinancialTimingCalendar` embedded in `UnifiedOperationalWorkspace`; cards link back to hub, Cash Flow, Operational Goals, Money Control |
| Interactive calendar | Tailwind monthly grid, native HTML5 drag-and-drop, no new heavy dependency |
| Drag-and-drop semantic | Drop on a future day → confirm dialog → POST `/shift-bill` → proposal in attention queue → user previews + applies in existing pipeline (zero autonomous side effect) |
| Google Calendar connection | (a) Per-event "Add to Google Calendar" deep link (no OAuth) and (b) subscribable HMAC-signed ICS feed; `STACKZEN_FEED_TOKEN_SECRET` env required at request time, returns 503 if absent |

## Validation results

| Command | Result |
|---------|--------|
| `npx prisma validate` | Passed |
| `npm run typecheck` (scoped `tsconfig.typecheck.json`) | Passed |
| `npx jest lib/timing-coordination` | **31 / 31 passed** (clusters, pressure, calendar-entries, ICS feed, feed-token) |
| `npx jest components/operational-workspace/TimingCoordinationPanel` | **1 / 1 passed** |
| `npx jest lib/operational-actions` | 2 / 2 passed (fingerprint regression) |
| `npx jest lib/cashflow lib/contractor-operations` | 10 / 10 passed (regression) |
| `npx jest lib/reserve-allocation-intelligence lib/workflow-resolution` | 22 / 23 — 1 **pre-existing** timezone-dependent test fail (`finds oldest pending proposal age and id`) unrelated to this layer; documented in the previous layer's report. |

## Phase 4 safety audit (manual)

- **Calendar correctness:** Calendar entries derive only from `forecast.windows[30d].events` + `Invoice.dueDate` + `OperationalGoal.targetDate`. No alternate projection, no transaction re-detection, no third cadence helper.
- **Shift correctness:** `SHIFT_RECURRING_BILL_DATE` apply step verifies the live fingerprint, then writes only `RecurringBill.nextDueDate`. No write to `lastTriggeredAt` / `autopayEnabled` / `reminderDaysBefore` / any other column.
- **Reserve-prep correctness:** `PREPARE_RESERVE_FOR_OBLIGATION` apply step does NOT touch `SmartAllocation`, `SmartBucket`, `OperationalGoal`, or `FinancialTransaction`. It writes only the existing `OPERATIONAL_FINANCIAL_ACTION_APPLIED` audit row.
- **Drag-and-drop safety:** Drop never triggers an apply. The POST `/shift-bill` route creates an `AutomationNotification` (status `pending`) and returns its id; the apply route remains the only mutation surface.
- **Ownership enforcement:** `requireAuthSession` on all `/api/operational-center/timing-coordination/*` routes; all Prisma queries scoped by `userId`. The public ICS route enforces HMAC token verification (`timingSafeEqual`) and is read-only.
- **Token safety:** `signFeedToken` requires a secret with length ≥ 16 (enforced in the API route), uses HMAC-SHA256, supports 180-day TTL, allows rotation by re-issuing.
- **Explainability:** Per-factor `reasoning[]`, snapshot `explain.assumptions` + `inputsUsed`, per-proposal `OperationalActionExplainDto`, per-calendar-entry `reasoning[]`.
- **Operational safety:** No auto money movement, no schema migration, no new `FinancialEventType`, no new cron, no third forecast call per hub refresh.
- **Determinism:** Clusters sort by `(startDate ASC, label ASC)` with stable tie-breaks; conflicts sort by `(date ASC, deficit DESC)`; calendar entries sort by `(date ASC, label ASC, id ASC)`. `computeLiveFingerprint` covers all five kinds.

## Remaining production gaps

1. **`STACKZEN_FEED_TOKEN_SECRET` env required.** The public ICS route returns 503 until the secret is set in production. This is intentional — we refuse to ship unsigned feeds.
2. **`PREPARE_RESERVE_FOR_OBLIGATION` does not build proposals automatically.** Like `SHIFT_RECURRING_BILL_DATE`, it is user-initiated. The calendar UI can be extended with a "Prepare reserve" button on cluster rows in a follow-up.
3. **No two-way Google Calendar OAuth sync.** Out of scope of the production rules: a real OAuth sync would store refresh tokens (new model + migration + secrets) and could in theory write back. The signed ICS subscription is the safer match for "deterministic, read-only, no autonomous changes". A follow-up OAuth track can be added if/when the team wants editable two-way sync — it would route writes through the same operational-actions pipeline.
4. **Pre-existing timezone-dependent Jest failure** in `lib/workflow-resolution/__tests__/aggregate.test.ts` (`finds oldest pending proposal age and id`). Confirmed unrelated to this layer; the host machine is in EDT/EST while the test fixtures use UTC midnights, producing a 10-day delta locally vs. 9-day expected. Fix tracked under the workflow-resolution layer.
5. **Windows `prisma generate` lock** as previously documented — not a code issue.

## Production readiness assessment

**Ready for staged rollout** with CI validation:

- Ownership-scoped APIs.
- Deterministic factor math; no synthetic health scores.
- Two new operational-action kinds carried entirely by the existing approval pipeline.
- Single forecast per hub refresh.
- ICS-based Google Calendar connection — no `googleapis` dependency, no token storage, no Prisma migration.
- Drag-and-drop, animations, dark-mode-ready Tailwind UI, mobile-responsive grid.
- 31 + 1 + regression-set tests green; pre-existing TZ failure not related.

The layer adds real operational timing capability — cluster detection, payout conflicts, reserve-prep guidance, and an explicit user-approved shift proposal — without inventing a generic calendar, autonomous scheduler, or duplicate workflow tracker.

---

## v1.1 — Calendar integration hardening (configuration + read/write accuracy)

Follow-up audit found three real integration issues. All fixed:

### Bug 1 · Sweep-guard for user-initiated proposals
`ensureOperationalActionProposals` previously marked **any** `operational_action_*` notification read if it wasn't in the auto-built desired set. That would silently kill drag-and-drop-created `SHIFT_RECURRING_BILL_DATE` proposals on the very next hub refresh.

- **Fix:** `lib/operational-actions/ensure-proposals.ts` now whitelists the auto-built kinds (`PAUSE_AUTOMATION_RULE | RECORD_GOAL_CONTRIBUTION | EXTEND_GOAL_TARGET_DATE`). User-initiated kinds (`SHIFT_RECURRING_BILL_DATE`, `PREPARE_RESERVE_FOR_OBLIGATION`) survive sweeps until the user explicitly dismisses or applies them.
- **Test:** `lib/operational-actions/__tests__/ensure-proposals.test.ts` exercises the guard with in-memory fakes.

### Bug 2 · Calendar feed bound to the 30-day forecast window
The calendar UI requested entries for the visible month grid (`from=` / `to=`), but the snapshot only generates entries within the 30-day forecast. Months outside that range rendered empty.

- **Fix:** `lib/timing-coordination/calendar-feed.ts` directly enumerates `RecurringBill`, `Invoice.dueDate`, and `OperationalGoal.targetDate` rows for the requested range and overlays the 30-day forecast where it overlaps. Range is clamped at 1–366 days.
- **Helper:** `enumerateRecurringBillOccurrences(bill, from, to)` is a pure function with a hard 366-iteration ceiling per direction. Supports weekly/biweekly/monthly/quarterly/yearly and treats unknown cadences as monthly.
- **API:** `app/api/operational-center/timing-coordination/calendar/route.ts` now uses `buildCalendarFeedForRange` and includes `pressureScore` in the response.
- **Tests:** `lib/timing-coordination/__tests__/enumerate-recurring.test.ts` covers six occurrence-enumeration scenarios.

### Bug 3 · Drag-drop navigated to a query param the page didn't consume
The submit handler `router.push('/operational-center?proposalId=...')` left users staring at the same workspace. Nothing scrolled to the proposal.

- **Fix:** Calendar now navigates to `/operational-center#operational-actions`. `OperationalFinancialActionPanel` already carries `id="operational-actions"`, so the new proposal is in view and `listPendingOperationalProposals` reads the same metadata we wrote.

### Configuration improvements
- **`.env.example`** now documents `STACKZEN_FEED_TOKEN_SECRET` with a rotation note: rotating the secret revokes every outstanding Google-Calendar subscription URL immediately.
- **`feed-token` route** added a `GET` configuration-check endpoint (`{ configured: boolean }`) so the UI can decide whether to show the "Subscribe" button. `POST` now derives the origin from `NEXT_PUBLIC_APP_URL` → `NEXTAUTH_URL` → request URL (in that order) instead of relying on `NEXTAUTH_URL` alone.

### Round-trip fingerprint guarantees
- `lib/operational-actions/__tests__/fingerprint.test.ts` extended with round-trip tests proving `fingerprintForShiftBill` and `fingerprintForPrepareReserve` agree with `computeLiveFingerprint` on the exact payload shape produced by the API routes — so a proposal created today never appears stale at apply time.
- Day-equivalent ISO strings (`T00:00:00Z` vs `T23:59:59Z`) produce the same shift-bill fingerprint, while different days produce different fingerprints.

### Read/write capability summary

| Direction | Surface | Capability |
| --- | --- | --- |
| Read (in-app) | Calendar UI → `GET /api/operational-center/timing-coordination/calendar?from&to` | Arbitrary date range; recurring bills, invoices, goals, and overlapping detected obligations |
| Read (external) | Google Calendar subscription → `GET /api/timing-coordination/calendar.ics?token=...` | Read-only ICS feed signed with HMAC; rotate by changing `STACKZEN_FEED_TOKEN_SECRET` |
| Write (in-app, indirect) | Drag-drop → `POST /api/operational-center/timing-coordination/shift-bill` | Creates a `SHIFT_RECURRING_BILL_DATE` proposal; user previews + applies; only `RecurringBill.nextDueDate` is written |
| Write (external) | Per-event "+ Google Calendar" deep links | One-shot template URL; user clicks to copy the event into their Google Calendar |

By design, StackZen never writes to a user's Google Calendar autonomously and never accepts writes from external calendars.

### Validation
- `npx jest lib/(timing-coordination|operational-actions)/__tests__` → **49/49 pass**.
- Regression set across `lib/(timing-coordination|operational-actions|cashflow|workflow-resolution|reserve-allocation-intelligence|contractor-operations)` → **81/82 pass** (the one failure is the unrelated, pre-existing timezone-dependent test in `workflow-resolution/__tests__/aggregate.test.ts`).
- `npm run typecheck` → clean.
- `npx prisma validate` → schema valid.

---

## v1.2 — Calendar lifted off the operations hub onto its own route

Feedback: the drag-and-drop calendar was embedded inline in `UnifiedOperationalWorkspace`, which doubles as the ops landing page. Drag-and-drop now lives only on a dedicated route.

### Changes
- **New route:** `app/(dashboard)/operational-center/calendar/page.tsx` renders `FinancialTimingCalendar` standalone with a "Back to operations hub" header.
- **Hub clean-up:** `components/operational-workspace/UnifiedOperationalWorkspace/index.tsx` no longer imports or renders `FinancialTimingCalendar`. Only the read-only `TimingCoordinationPanel` remains on the hub.
- **TimingCoordinationPanel** now points every "Open calendar" surface (guidance row link, footer button, and the snapshot description) to `/operational-center/calendar`. Removed the `#financial-timing-calendar` in-page anchor.
- **Test added:** `TimingCoordinationPanel.test.tsx` asserts every "timing calendar" link resolves to `/operational-center/calendar`.

### Effect
- The operations hub is a pure summary/landing surface again — no drag-and-drop, no proposal-creating UI inline.
- The interactive calendar is its own deep tool at `/operational-center/calendar`, reached via the snapshot link or the guidance row.
- Drag-drop → `POST /shift-bill` → confirmation dialog → `router.push('/operational-center#operational-actions')` workflow is unchanged; users still land back on the hub at the approval panel.

### Validation
- Focused tests (`timing-coordination`, `operational-actions`, `UnifiedOperationalWorkspace`, `TimingCoordinationPanel`, `WorkflowResolutionPanel`) → **53/53 pass** including the new link assertion.
- `npm run typecheck` → clean.
