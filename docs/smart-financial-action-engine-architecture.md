# Smart Financial Action Engine — architecture

Deterministic, **user-approved** operational execution. No autonomous money movement, no hidden automation, no opaque AI execution. Reuses `AutomationNotification` as the attention queue, `buildCashFlowForecast`, goal analysis, automation rules, `SmartAllocation` / goal contribution pipeline, and `FinancialEvent` for audit.

## 1. Action types (v1)

| Kind | Mutation | Preconditions |
|------|----------|----------------|
| `PAUSE_AUTOMATION_RULE` | `PATCH /api/automation/rules/:id` `{ enabled: false }` | Forecast includes `ALLOCATION_PRESSURE`; user has ≥1 **enabled** `AutomationRule` with `type === ALLOCATION`; pick single discretionary candidate (**lowest priority** = highest numeric `priority` value among enabled allocation rules). |
| `RECORD_GOAL_CONTRIBUTION` | `recordGoalContribution` | Active goal with `MISSED_TARGET_PACE` finding; suggested amount = `round(min(500, max(25, requiredAverageDaily × 7)), 2)` capped by remaining. |
| `EXTEND_GOAL_TARGET_DATE` | `OperationalGoal.targetDate` += 14 calendar days | Active goal with `MISSED_TARGET_PACE` and non-null `targetDate`. |

Future types (redirect surplus, reserve target bumps, discretionary % sliders) should extend the same **proposal → preview → apply** envelope without a second orchestration service.

## 2. User approval

- **Preview** — `POST /api/operational-center/operational-actions/[notificationId]/preview` returns `forecastSummaryBefore`, proposal-specific impact lines, and `fingerprint`.
- **Apply** — `POST .../apply` requires JSON `{ "confirm": true, "acknowledgedImpact": true }` (Zod strict). Missing flags → `400`.
- UI must surface **expected impact** strings stored on the proposal (`explain.expectedImpact`).

## 3. Operational chaining

```
forecast + goals + rules
  → build proposals (deterministic)
  → ensure upserts AutomationNotification (pending)
  → user preview (read-only forecast + arithmetic)
  → user apply (confirm flags)
  → validate fingerprint (stale → 409)
  → single Prisma mutation / recordGoalContribution
  → FinancialEvent OPERATIONAL_FINANCIAL_ACTION_APPLIED (+ existing side-effect events)
  → buildCashFlowForecast again
  → return forecastSummaryAfter + mark notification applied/read
```

## 4. Explainability

Each proposal stores:

- `explain.why`, `dataInfluences`, `calculations`, `expectedImpact`
- `payload` (ids only — no free-form AI)
- `fingerprint` inputs documented in `lib/operational-actions/fingerprint.ts`

## 5. Safety

- **Ownership** — all lookups `userId` scoped; ids re-checked before mutation.
- **Stale execution** — fingerprint includes `forecast.generatedAt` + entity ids + kind; mismatch rejects apply.
- **Totals** — contribution uses existing positive-amount validation in `recordGoalContribution`; rule pause uses existing PATCH validation (tier limits when re-enabling elsewhere).
- **Duplicate execution** — `status: applied` short-circuits apply route with `409`.
- **Unsafe totals** — v1 does not auto-adjust allocation percentages (only pause whole rule); avoids partial math errors.

## 6. Operational workspace integration

- **`OperationalFinancialActionPanel`** lists pending proposals (`GET /api/operational-center/operational-actions`).
- **`OPEN_OPERATIONAL_ACTION`** client action deep-links to `/operational-center` (scroll target via in-page anchor `#operational-actions`).
- **Ensure pipeline** — `GET /api/operational-center/alerts?ensure=true` calls `ensureOperationalActionProposals` after guidance so proposals refresh with the same forecast generation cycle.

## Persistence shape (`AutomationNotification.metadata`)

```json
{
  "attentionKind": "operational_action_pause_rule_clxyz...",
  "operationalActionProposal": {
    "version": 1,
    "status": "pending|applied|dismissed|stale",
    "kind": "PAUSE_AUTOMATION_RULE",
    "fingerprint": "…",
    "payload": { },
    "explain": { },
    "lastForecastGeneratedAt": "ISO"
  },
  "trust": { },
  "actions": [ { "type": "OPEN_OPERATIONAL_ACTION", "notificationId": "…" } ]
}
```

## API summary

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/operational-center/operational-actions` | List pending proposals for session user. |
| POST | `.../operational-actions/[notificationId]/preview` | Read-only preview + fingerprint check. |
| POST | `.../operational-actions/[notificationId]/apply` | Execute with confirm flags. |
| POST | `.../operational-actions/[notificationId]/dismiss` | Dismiss without mutation. |
