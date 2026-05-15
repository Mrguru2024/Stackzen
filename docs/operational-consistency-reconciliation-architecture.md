# Operational Consistency & Reconciliation — Architecture

## Objectives

Provide **deterministic**, **traceable**, and **auditable** operational integrity for StackZen across ledger-derived forecast inputs, goal buckets, and the operational attention queue — without duplicate aggregate systems or silent mutations.

## Principles

1. **Prisma remains canonical**; `FinancialTransaction` remains the bank ledger.
2. **FinancialEvent** records integrity runs and auditable repairs.
3. **AutomationNotification** remains the operational attention queue; repairs retire or collapse rows with explicit JSON metadata.
4. **No hidden cron** inside library code; scheduling is an external deployment concern.
5. **Reuse** existing engines: `buildCashFlowForecast`, `buildGuidanceRecommendations`, `analyzeOperationalGoal`, `reconcileDerivedOperationalAttention`.

## Components

### Checks (`lib/operational-integrity/checks.ts`)

| Code | Severity | Purpose |
|------|----------|---------|
| `LEDGER_FORECAST_SAMPLE_CAPPED` | warning | Transaction count in lookback exceeds forecast sample cap |
| `GOAL_BUCKET_ALLOCATION_TOTAL_MISMATCH` | escalate | `SmartBucket.currentAmount` ≠ sum of `SmartAllocation` for bucket (ACTIVE goals) |
| `DUPLICATE_UNREAD_OPERATIONAL_ATTENTION` | warning | Multiple unread rows share same `attentionKind` |
| `ORPHAN_GOAL_ATTENTION_NOTIFICATION` | warning | Notification references missing goal |
| `STALE_NONACTIVE_GOAL_ATTENTION` | info | Derived goal notification for non-ACTIVE goal |
| `STALE_GUIDANCE_ATTENTION_ROW` | info | Unread `guidance_*` kind not in current recommendations |
| `STALE_CASHFLOW_ATTENTION_ROW` | info | Unread `cashflow_*` kind not in current forecast risks |

Checks are **pure reads** plus engine calls already used by product surfaces.

### Repairs (`lib/operational-integrity/repairs.ts`)

| Repair code | Mutation | Audit |
|-------------|----------|-------|
| `GOAL_BUCKET_TOTAL_REALIGNED_TO_ALLOCATIONS` | `SmartBucket.currentAmount` := rounded sum(allocations) for that bucket | `FinancialEventType.GOAL_UPDATED` with `metadata.integrityRepair` |
| `COLLAPSE_DUPLICATE_ATTENTION_KIND` | Mark duplicate unread rows read | `OPERATIONAL_ATTENTION_AUTO_RESOLVED` with `reason: integrity_duplicate_attention_collapsed` |
| `ORPHAN_GOAL_ATTENTION_CLEARED` | Mark read | `OPERATIONAL_ATTENTION_AUTO_RESOLVED` |
| `STALE_NONACTIVE_GOAL_ATTENTION_CLEARED` | Mark read | `OPERATIONAL_ATTENTION_AUTO_RESOLVED` |

Unsafe repairs (e.g. rewriting `FinancialTransaction`, inventing allocations) are **out of scope** for `repair_safe`.

### Orchestrator (`lib/operational-integrity/run-operational-integrity.ts`)

- **`detect`**: runs checks; emits `OPERATIONAL_INTEGRITY_SCAN` only if `violations.length > 0`.
- **`repair_safe`**: runs checks, applies repairs in order (bucket drift from violation list → duplicates → orphan/stale goal), emits `OPERATIONAL_INTEGRITY_SCAN` **always** (audit trail of explicit repair run).

The orchestrator **does not** call `reconcileDerivedOperationalAttention` so that **`detect` stays read-only**. The HTTP layer invokes reconciliation after repairs.

### FinancialEventType

- **`OPERATIONAL_INTEGRITY_SCAN`**: summary metadata (`mode`, violation/repair codes, truncated lists). Migration: `prisma/migrations/20260511120000_operational_integrity_scan_event`.

### Shared constants

- **`DERIVED_GOAL_NOTIFICATION_TYPES`** in `lib/goals/constants.ts`: shared between reconciliation and integrity to avoid drift.

## HTTP contract

`GET /api/operational-center/alerts`

| Query | Behavior |
|-------|----------|
| `ensure=true` (default) | Runs all ensure* functions |
| `integrity=detect` | Read-only integrity scan; response includes `operationalIntegrity` |
| `integrity=repair_safe` | Safe repairs, then response includes `operationalIntegrity` |
| (none) | If `ensure` or `repair_safe`, runs `reconcileDerivedOperationalAttention` once at end |

**Ordering**

1. If `ensure`: all ensures (no reconcile yet).
2. If `integrity=detect`: `runOperationalIntegrityScan({ mode: 'detect' })`.
3. If `integrity=repair_safe`: `runOperationalIntegrityScan({ mode: 'repair_safe' })`.
4. If `ensure` **or** `integrity=repair_safe`: `reconcileDerivedOperationalAttention` — `operationalIntegrity.derivedAttentionAutoResolved` reflects this pass.

## Forecast consistency

- No snapshot table to reconcile; integrity focuses on **ledger sample cap** visibility and attention alignment to live forecast output.

## Goal consistency

- Bucket vs allocation sum is the primary **numeric** integrity invariant for ACTIVE operational goals.

## Guidance consistency

- Stale-row detection is informational and complements (does not replace) `reconcileDerivedOperationalAttention`.

## Explainability

- Repairs set `metadata.integrityRepairAt`, `integrityRepairCode`, `integrityRepairReason` on affected notifications where applicable.
- Bucket repair uses `GOAL_UPDATED` with structured `integrityRepair` metadata for `OperationalExplainabilityDto` consumers that surface financial events.

## Future extensions (not implemented here)

- Server-side cron route with shared secret or Vercel cron + **user batch** iteration.
- Stronger serialization for bucket repair under concurrent contributions (e.g. advisory lock per user).
- Deeper invoice/notification orphan sweeps beyond goal scope.
