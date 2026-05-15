# Operational Consistency & Reconciliation — Phase 1 Audit

This document inventories existing StackZen systems that touch operational consistency, what reconciliation already exists, where drift and duplication can occur, and gaps addressed by the integrity layer added in this milestone.

## 1. Existing aggregate systems

| Area | Mechanism | Canonical store |
|------|------------|-----------------|
| Ledger | `FinancialTransaction` with `dedupeHash` uniqueness per user | Prisma / Postgres |
| Cash flow projection | `buildCashFlowForecast` — recomputes from transactions, bills, invoices, jobs, `SmartAllocation` trailing pace | No persisted forecast snapshot; `generatedAt` on DTO only |
| Goal progress | `OperationalGoal` + `SmartBucket.currentAmount` + `SmartAllocation` rows (`source` = `OPERATIONAL_GOAL:{id}`) | Bucket balance for UI pace; 30d contribution average from allocations |
| Allocation pressure in forecast | `loadWeeklyAllocationEstimate` → daily drag | Derived from `SmartAllocation` aggregate |
| Operational attention | `AutomationNotification` + optional `attentionKind` in `metadata` | Single queue; upserts keyed by `attentionKind` or goal + kind |
| UX checkpoint | `UserOperationalCheckpoint` JSON payload | Documented as not a second attention queue |
| Audit trail | `FinancialEvent` | Types include cashflow, goals, guidance, automation, `OPERATIONAL_ATTENTION_AUTO_RESOLVED` |
| Explainability | `buildOperationalExplainability` + `OperationalExplainabilityDto` | Assembled from notification metadata + linked events |

## 2. Existing reconciliation logic

- **`ensureOperationalAttentionNotifications`** (`lib/operational-notifications/ensure-attention.ts`): idempotent invoice/job overdue rows; uses `attentionKind` dedupe for some kinds.
- **`ensureCashflowAttentionNotifications`** (`lib/cashflow/ensure-cashflow-attention.ts`): upserts one row per forecast risk `cashflow_{code}`.
- **`ensureGoalPlanningAttentionNotifications`** (`lib/goals/ensure-goal-attention.ts`): upserts per active goal finding; `attentionKind` = `{kind}_{goalId}`.
- **`ensureGuidanceAttentionNotifications`** (`lib/guidance/ensure-guidance-notifications.ts`): upserts `guidance_{attentionKey}`; emits `GUIDANCE_ENGINE_SYNCED`.
- **`reconcileDerivedOperationalAttention`** (`lib/operational-state/reconcile-derived-attention.ts`): compares unread rows with `attentionKind` to current guidance, forecast risks, and goal analysis; marks read with `autoResolvedReason`; emits `OPERATIONAL_ATTENTION_AUTO_RESOLVED`. Respects dismiss/snooze helpers.
- **Goal contributions** (`lib/goals/apply-contribution.ts`): transactional `SmartAllocation` + bucket increment + `FinancialEvent` — keeps ledger and bucket in sync on the happy path.

**API orchestration:** `GET /api/operational-center/alerts` runs the ensure pipeline and reconciliation (see route file).

## 3. Existing stale-state risks

- **Forecast “staleness”**: projection is always computed on read; staleness is really **sample truncation** when `FinancialTransaction` count in the lookback exceeds `MAX_TRANSACTION_ROWS` (`lib/cashflow/constants.ts`).
- **Guidance / cashflow attention**: rows can remain unread if the engine no longer emits a risk/recommendation until `reconcileDerivedOperationalAttention` runs.
- **Goal attention**: non-`ACTIVE` goals may still have unread derived notifications if lifecycle changed without a pass.
- **Orphan notifications**: goal deleted but notification still references `OPERATIONAL_GOAL` id.

## 4. Existing lifecycle risks

- Goal completed or archived while unread `GOAL_*` notifications remain.
- Duplicate unread rows sharing the same `attentionKind` (race, manual data, legacy paths) — upsert uses `findFirst`; two rows can coexist.

## 5. Operational drift risks

- **Bucket vs allocation sum**: if `SmartBucket.currentAmount` diverges from `sum(SmartAllocation.amount)` for that bucket, `analyzeOperationalGoal` and milestones become **non-reproducible** from allocations alone.
- **Cross-subsystem ordering**: ensure vs reconcile order affects what a user sees for one HTTP request; must be explicit and documented per route.

## 6. Duplication risks

- Multiple `AutomationNotification` rows with the same `attentionKind` and `readAt: null`.
- Parallel “health score” or duplicate aggregate stores — **not present** in schema reviewed for this milestone; integrity layer must not add them.

## 7. Missing integrity workflows (before this build)

- No structured **detect** pass returning machine-readable violations for operations.
- No **audited** repair for bucket vs allocation drift.
- No **audited** collapse of duplicate unread attention rows.
- No single **FinancialEvent** type summarizing an integrity run (now `OPERATIONAL_INTEGRITY_SCAN`).

## 8. Recommended reconciliation architecture

- **Single orchestrator** (`runOperationalIntegrityScan`) calling deterministic checks and optional **repair_safe** mutations.
- **Reuse** `buildCashFlowForecast`, `buildGuidanceRecommendations`, `reconcileDerivedOperationalAttention`, `FinancialEvent`, `AutomationNotification` — no parallel ledger.
- **Caller-owned ordering**: ensures → integrity (`detect` | `repair_safe`) → `reconcileDerivedOperationalAttention` when mutations or ensures are involved (see architecture doc).

## 9. Safe implementation strategy

- Default HTTP behavior unchanged; integrity invoked via `integrity` query param.
- **detect**: read-only checks; emits `OPERATIONAL_INTEGRITY_SCAN` only when violations exist.
- **repair_safe**: bounded repairs (bucket realign from allocations, duplicate collapse, orphan/stale goal attention) each with `FinancialEvent` audit; then derived reconciliation.
- Escalating violations (e.g. bucket mismatch) remain visible until repaired; repair uses explicit metadata on `GOAL_UPDATED` and `OPERATIONAL_ATTENTION_AUTO_RESOLVED`.

### Files reviewed (non-exhaustive but representative)

- `prisma/schema.prisma` — `FinancialTransaction`, `FinancialEvent`, `SmartBucket`, `SmartAllocation`, `OperationalGoal`, `AutomationNotification`, `UserOperationalCheckpoint`
- `lib/cashflow/forecast.ts`, `lib/cashflow/explain.ts`, `lib/cashflow/ensure-cashflow-attention.ts`, `lib/cashflow/constants.ts`
- `lib/guidance/engine.ts`, `lib/guidance/ensure-guidance-notifications.ts`
- `lib/goals/analyze.ts`, `lib/goals/apply-contribution.ts`, `lib/goals/ensure-goal-attention.ts`, `lib/goals/constants.ts`
- `lib/operational-state/reconcile-derived-attention.ts`
- `lib/operational-notifications/ensure-attention.ts`, `lib/operational-notifications/helpers.ts`
- `lib/financial-events/events.ts`
- `lib/explainability/build-operational-explainability.ts`
- `app/api/operational-center/alerts/route.ts`

**Background jobs:** No mandatory cron was added; callers (or future `vercel.json` cron hitting a secured route) can schedule `integrity=repair_safe` explicitly.
