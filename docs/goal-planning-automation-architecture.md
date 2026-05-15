# Goal Planning & Automation — Architecture

**Purpose:** Operational financial goals (not passive progress bars) integrated with buckets, allocations, cash flow forecast, FinancialEvent, and Operational Center.

---

## Design principles

1. **Deterministic & explainable** — Risk and pace math documented in API responses (`explain` blocks).
2. **Single allocation pipeline** — Contributions = `SmartAllocation` + `SmartBucket.currentAmount` updates.
3. **Forecast-aware** — `buildCashFlowForecast` informs pressure and deadline risk.
4. **Attention-native** — `ensureGoalPlanningAttentionNotifications` mirrors cashflow ensure semantics.

---

## Data model

### `OperationalGoal`

| Field | Purpose |
|-------|---------|
| `goalKind` | emergency, debt, tax, equipment, moving, vacation, business reserve, runway, custom |
| `targetAmount` / `targetDate` | Planning horizon (optional date → default analysis horizon) |
| `smartBucketId` | **Balance source of truth** |
| `automationMode` | Manual, fixed, % income, round-up, surplus, paycheck split, contractor % (execution hooks = future / manual contribution now) |
| `automationConfig` | JSON: `{ fixedAmount?, percentOfIncome?, surplusPercent?, ... }` |
| `priority` | Lower number = higher priority for surplus routing (documented for future automation) |
| `status` | ACTIVE, PAUSED, COMPLETED, ARCHIVED |

### `SmartBucket` (goal fund)

- `type = GOAL_FUND` for auto-provisioned buckets.
- `currentAmount` reflects cumulative allocations (including `OPERATIONAL_GOAL:{id}` sources).

### `SmartAllocation`

- `source = OPERATIONAL_GOAL:{goalId}` for goal contributions.
- Optional `financialTransactionId` when a contribution is tied to a specific ledger row (future).

---

## Event & notification taxonomy

### `FinancialEventType` (goal-related)

- `GOAL_CREATED`, `GOAL_UPDATED`, `GOAL_MILESTONE_REACHED`, `GOAL_RISK_EVALUATED`, `GOAL_CONTRIBUTION_RECORDED`
- Source: `API_GOALS` where applicable (plus existing automation sources for unified feeds).

### `AutomationNotificationType` (goal-related)

- `GOAL_PACE_WARNING` — trailing contribution pace insufficient for deadline.
- `GOAL_UNSAFE_CONTRIBUTION` — forecast indicates allocation pressure vs. goal demand.
- `GOAL_MILESTONE` — 25/50/75/100% progress on linked bucket.
- `GOAL_FORECAST_CONFLICT` — low projected balance window + aggressive goal pace.

Metadata: `attentionKind: goal_*`, `trust` block, `actions: [{ type: 'OPEN_OPERATIONAL_GOAL', goalId }]`.

---

## Libraries

| Module | Responsibility |
|--------|----------------|
| `lib/goals/constants.ts` | `goalAllocationSource(id)`, bucket type `GOAL_FUND` |
| `lib/goals/analyze.ts` | Pace, deadline, forecast pressure; returns `GoalAnalysisDto` + `explain[]` |
| `lib/goals/apply-contribution.ts` | Transactional allocation + milestone events |
| `lib/goals/ensure-goal-attention.ts` | Idempotent notifications per goal + risk codes |
| `lib/goals/types.ts` | Shared DTOs |

---

## API surface (authenticated)

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/api/goals/operational` | List goals with derived `currentAmount`, `analysisSummary` |
| POST | `/api/goals/operational` | Create goal (+ optional auto bucket) |
| GET | `/api/goals/operational/[id]` | Detail + full `analyze` |
| PATCH | `/api/goals/operational/[id]` | Update fields, pause/resume (`status`), priority, targets |
| POST | `/api/goals/operational/[id]/contribution` | Manual contribution (operational workflow) |

---

## UI: `/goals/operational`

- Goal list with **pace / deadline / risk** callouts from analysis (not vanity charts).
- Actions: contribute, pause, edit targets, open linked bucket (Money Control path), open cash flow.
- Dark-mode ready Tailwind; uses existing Card/Button patterns.

---

## Operational Center integration

- `GET /api/operational-center/alerts?ensure=true` calls `ensureGoalPlanningAttentionNotifications` after existing ensures.
- Domain **`goals`** in `OperationalUiDomain` for filtering.

---

## Future extensions (non-blocking)

- Wire `GoalAutomationMode` to **AutomationRule** metadata or dedicated triggers on `TRANSACTION_POSTED`.
- Auto round-up via ledger rounding on sync.
- Debt payoff: link to liability accounts when modeled.

---

*End of architecture document.*
