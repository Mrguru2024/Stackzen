# Smart allocation & reserve automation — audit (Phase 1)

This audit maps **existing** StackZen systems that touch SmartAllocation, SmartBucket, automation, reserves, forecast, guidance, contractor ops, operational actions, Money Control, and `FinancialEvent` — before adding a consolidated **reserve / allocation intelligence** layer.

## 1. Existing allocation systems

| Area | Location | Role |
|------|----------|------|
| **SmartAllocation ledger** | `prisma/schema.prisma` → `SmartAllocation` | Canonical rows: `amount`, `bucketId`, `source`, optional `financialTransactionId`. |
| **Goal-linked allocations** | `lib/goals/constants.ts`, `lib/goals/apply-contribution.ts` | `source` pattern `goal:<goalId>`; creates allocation + bucket increment + `FinancialEvent`. |
| **Automation rule allocations** | `lib/financial-automation/allocation-persistence.ts` | `replaceAutomationAllocationsForTransaction`: replaces rows per rule+txn, adjusts `SmartBucket.currentAmount`; `source` = `AUTOMATION_RULE:<ruleId>`. |
| **Automation evaluation** | `lib/financial-automation/rules-engine.ts`, `transactions.ts`, `classification.ts` | Rule execution drives **when** allocations are written — not a second allocation engine. |
| **Forecast allocation drag** | `lib/cashflow/forecast.ts` | Trailing 28-day sum of **all** `SmartAllocation` ÷ 4 → weekly estimate; applied as daily drag in 30d/90d windows. |
| **Integrity repairs** | `lib/operational-integrity/repairs.ts`, `checks.ts` | Reconciles goal bucket totals vs sum of allocations (`GOAL_BUCKET_ALLOCATION_TOTAL_MISMATCH`). |

**Finding:** There is **one** write path for allocation rows (Prisma `smartAllocation.create` / automation replace). Duplication risk is **re-implementing** weekly drag or bucket math outside `buildCashFlowForecast` / `replaceAutomationAllocationsForTransaction`.

## 2. Existing reserve systems

| Area | Location | Role |
|------|----------|------|
| **OperationalGoal + SmartBucket** | `OperationalGoal`, `SmartBucket` | Reserve-like goals (`EMERGENCY_FUND`, `TAX_RESERVE`, `BUSINESS_RESERVE`, `RUNWAY`, …) use `smartBucket.currentAmount` vs `targetAmount`. |
| **Goal automation modes** | `GoalAutomationMode` enum | `MANUAL_ONLY`, `PERCENT_OF_INCOME`, `CONTRACTOR_PERCENT`, etc. — configuration only; execution still flows through existing automation/goal paths. |
| **Goal analysis** | `lib/goals/analyze.ts` | Pace, `MISSED_TARGET_PACE`, `ALLOCATION_PRESSURE_CONFLICT` using forecast window 30d + trailing 30d goal allocations. |
| **Income intelligence reserve nudges** | `lib/income-intelligence/snapshot.ts` | Deterministic nudges from concentration / delayed income / forecast codes — **text**, not auto-transfers. |
| **Contractor reserve nudges** | `lib/contractor-operations/snapshot.ts` | Forecast overlap, receivable concentration, tax goal suggestion — **snapshot only**. |

**Finding:** No separate “reserve ledger” besides **SmartBucket + SmartAllocation** and bank balances used in forecast.

## 3. Existing operational guidance systems

| Area | Location | Role |
|------|----------|------|
| **Guidance engine** | `lib/guidance/engine.ts` | Composes `buildCashFlowForecast` risks + per-goal `analyzeOperationalGoal` + invoices/guardrails → recommendations. |
| **Guidance → notifications** | `lib/guidance/ensure-guidance-notifications.ts` | Upserts `AutomationNotification` rows with `attentionKind` prefix `guidance_`. |

**Finding:** Guidance already encodes **deterministic** cross-domain signals. New reserve intelligence should **compose** the same primitives (forecast, goals, contractor snapshot) rather than invent parallel “health scores.”

## 4. Existing contractor reserve logic

| Area | Location | Role |
|------|----------|------|
| **Contractor financial ops snapshot** | `lib/contractor-operations/snapshot.ts` | Material exposure, negative margin jobs, receivable HHI, late payers, collection spread, `TAX_RESERVE_SUGGESTED` nudge. |
| **Contractor attention queue** | `lib/contractor-operations/ensure-attention.ts` | `contractor_ops_*` portfolio alerts. |

**Finding:** Contractor reserve messaging is **operational** (deposits, AR, tax goal), not automatic withholding.

## 5. Existing automation systems

| Area | Location | Role |
|------|----------|------|
| **AutomationRule** | `prisma/schema.prisma` | `type`, `actions` JSON, `enabled`, `priority`. |
| **SavingsRule / RuleAllocation** | Same schema | Separate savings automation surface (not merged into SmartAllocation in this audit path). |
| **Notifications** | `createAutomationNotification` in `rules-engine.ts` | Central creation for automation-driven alerts. |

**Finding:** Pausing or editing rules is user-driven via Money Control; **no** autonomous outbound transfers were found in allocation persistence.

## 6. Existing explainability systems

| Area | Location | Role |
|------|----------|------|
| **Forecast explain** | `lib/cashflow/explain.ts` | Assumptions + `inputsUsed` including `weeklyAllocationEstimateUsd`. |
| **Operational alert trust** | `lib/operational-notifications/enrich.ts`, `lib/explainability/build-operational-explainability.ts` | `metadata.trust` for cards. |
| **Operational financial actions** | `lib/operational-actions/types.ts`, `preview.ts`, `apply.ts` | Proposal `explain` + live fingerprint staleness; **explicit apply** only. |

**Finding:** Any new reserve layer should attach **structured reasons** (inputs + formulas) and reuse `buildOperationalAttentionMetadata` + `trust`.

## FinancialEvent systems (canonical operational audit)

| Area | Location | Role |
|------|----------|------|
| **FinancialEvent model** | `prisma/schema.prisma` | Append-only operational history (`type`, `source`, `relatedEntityType` / `relatedEntityId`, `metadata`). |
| **Goal / integrity paths** | `lib/goals/apply-contribution.ts`, `lib/operational-integrity/repairs.ts` | Emit events when goal buckets or repairs change — reserve intelligence **does not** write events on read-only snapshot/ensure beyond existing notification flows. |
| **Workspace correlation** | `app/api/operational-center/alerts/route.ts` | Loads recent `FinancialEvent` rows to enrich alert cards with audit context. |

**Finding:** Reserve allocation intelligence remains **read-only** on snapshot/ensure paths; user-approved mutations continue to log through existing write paths (`FinancialEvent` producers).

## Money Control workflows

| Area | Location | Role |
|------|----------|------|
| **UI shell** | `app/(dashboard)/money-control/page.tsx` → `components/money-control` | Review tab (transactions), rules, buckets — where users **manually** adjust allocation automation and categorization. |
| **Operational checkpoint** | `UnifiedOperationalWorkspace` | Resume links into Money Control review when a transaction is in progress. |

**Finding:** “Reserve execution” in product language maps to **user navigation + explicit apply** (Money Control, Goals, operational financial actions), not server-side auto-budgeting.

## 7. Duplication risks

1. **Second weekly allocation estimate** — must read from `buildCashFlowForecast` / its `explain.inputsUsed`, not re-query Prisma with a different window unless intentional.
2. **Second “allocation pressure” detector** — `analyzeRisks` already emits `ALLOCATION_PRESSURE`; do not re-score with a different formula in UI-only code.
3. **Second goal pace engine** — reuse `analyzeOperationalGoal` for proposals; reserve panel can **summarize** without re-implementing `requiredAverageDaily`.
4. **Overlapping alerts** — `guidance_*`, `cashflow_*`, `operational_action_*`, and `contractor_ops_*` may all reference low balance; use **distinct `attentionKind`** and dedupe keys so the workspace can collapse safely.

## 8. Missing reserve / allocation workflows (gaps)

| Gap | Desired behavior (operational, not autonomous) |
|-----|--------------------------------------------------|
| **Unified reserve pressure view** | Single deterministic read model combining forecast risks, allocation drag, goal reserve fill, contractor stress. |
| **Explicit “before / after” for allocation-affecting actions** | Already partially covered by `buildOperationalActionPreview`; reserve layer should **reference** proposals, not silently change rules. |
| **Volatility-aware copy** | Forecast already exposes pattern confidence; optional flag when detected income series are weakly confident or `unknown` cadence. |
| **Discretionary vs reserve prioritization** | Textual guidance when `ALLOCATION_PRESSURE` coincides with under-filled emergency/tax/runway goals — user approves changes in Money Control / Goals. |
| **Contractor ↔ personal reserve bridge** | Surface when contractor material/receivable stress **and** personal forecast risks fire together. |

## 9. Recommended operational architecture

1. **`buildReserveAllocationSnapshot(userId)`** — One orchestrator: `buildCashFlowForecast` (single call), optional **shared** forecast injected into `buildContractorFinancialOpsSnapshot` to avoid duplicate forecast work, Prisma read for active goals (reserve kinds), count of enabled `ALLOCATION` rules.
2. **Pure `buildReservePressureFactors(...)`** — Deterministic list of factors + integer **score** (count of active factors), each with human-readable `reasoning[]`.
3. **`ensureReserveAllocationAttentionNotifications(userId, cachedSnapshot?)`** — At most **one** portfolio notification `reserve_alloc_ops_elevated_pressure` when score ≥ threshold or critical low-balance; auto-resolve when pressure drops.
4. **Workspace panel** — Renders snapshot + links to Money Control (rules/buckets), Cash Flow, Goals, contractor panel context.
5. **Keep `ensureOperationalActionProposals`** as the **only** path for applyable mutations (pause rule, contribution, extend date).

## 10. Safe implementation strategy

1. **No new Prisma models** in v1; no automatic rule edits; no transfers.
2. **Ownership:** all APIs `requireAuthSession`, userId-scoped queries only.
3. **Tests:** pure factor builder + snapshot shape; Jest avoids Prisma where possible.
4. **CI:** run `prisma validate`, `typecheck`; Windows `EPERM` on generated client is environmental — document in completion report.
5. **Rollout:** ship snapshot + optional notification first; extend operational action **kinds** only if product needs a new apply path with the same preview/apply contract.

## Files explicitly reviewed for this audit

- `prisma/schema.prisma` (SmartAllocation, SmartBucket, AutomationRule, OperationalGoal, AutomationNotification, FinancialEvent, SavingsRule, RuleAllocation, FinancialTransaction)
- `lib/cashflow/forecast.ts`, `lib/cashflow/risk.ts`, `lib/cashflow/explain.ts`
- `lib/financial-automation/allocation-persistence.ts`, `rules-engine.ts` (partial)
- `lib/goals/analyze.ts`, `lib/goals/apply-contribution.ts`
- `lib/guidance/engine.ts`
- `lib/contractor-operations/snapshot.ts`, `ensure-attention.ts`
- `lib/operational-actions/build-proposals.ts`, `ensure-proposals.ts`, `preview.ts`, `types.ts`
- `app/api/operational-center/alerts/route.ts`
- `app/(dashboard)/money-control/page.tsx`
- `components/operational-workspace/UnifiedOperationalWorkspace/index.tsx`

---

## V2 audit refresh (continuation pass)

This refresh re-audits the **shipped v1** of `lib/reserve-allocation-intelligence/*` plus the explicit v1 production gaps before extending the layer.

### V1 ship status (re-verified)

| Surface | Path | Status |
|---------|------|--------|
| Snapshot orchestrator | `lib/reserve-allocation-intelligence/snapshot.ts` | Ships; reuses one `buildCashFlowForecast` + shared-forecast contractor snapshot. |
| Pure pressure factors | `lib/reserve-allocation-intelligence/pressure.ts` | Ships; deterministic binary factors, `pressureScore = factors.length`. |
| Attention notification | `lib/reserve-allocation-intelligence/ensure-attention.ts` | Ships; portfolio `reserve_alloc_ops_elevated_pressure`, auto-resolves. |
| Operations API | `app/api/operational-center/reserve-allocation-intelligence/route.ts` | Ships; ownership-scoped, optional ensure. |
| Workspace panel | `components/operational-workspace/ReserveAllocationIntelligencePanel/*` | Ships; renders factors, guidance, weekly pace, rule sample. |
| Hub bundle | `buildReserveAndContractorIntelligenceBundle` | Ships; single forecast + contractor snapshot for hub ensures. |
| Dedupe / domain | `lib/operational-notifications/dedupe-key.ts` + `enrich.ts` | Ships with `reserve_alloc_ops_*` mapping (domain `financial`). |
| Tests | `lib/reserve-allocation-intelligence/__tests__/pressure.test.ts` | Pure unit tests pass. |

### V1 gaps confirmed by code review

1. **No SavingsRule visibility.** `SavingsRule` + `RuleAllocation` are separate automation tables; the v1 snapshot does not surface their existence even when they materially affect reserve pacing. Risk: users seeing an empty `enabledAllocationRulesSample` may believe no automation exists.
2. **No discretionary-spend pressure factor.** Only `ALLOCATION_PRESSURE` from forecast is surfaced; there is no signal when *manual* discretionary outflow share is large enough to crowd reserve goals.
3. **Generic `CREATE_GOAL` action even when an existing reserve goal is under-filled.** `ensureReserveAllocationAttentionNotifications` does not pass `OPEN_OPERATIONAL_GOAL { goalId }` for the most under-filled reserve goal.
4. **No structured top-underfilled list in the snapshot.** Panel currently shows only `reserveGoalUnderfillCount` (integer). Users do not see *which* goals are under target without leaving the panel.
5. **No counterfactual rule pause preview.** Out of v2 scope (kept owned by `lib/operational-actions/*` proposals + preview).

### Duplication / conflict re-check

- **No second allocation engine introduced.** All weekly allocation pace numbers continue to come from `buildCashFlowForecast`'s `explain.inputsUsed.weeklyAllocationEstimateUsd`.
- **No alternate goal pace math added.** Under-fill stays a single deterministic rule (`min(bucket, target) / target < 0.5`).
- **No autonomous transfers introduced anywhere in reserve intelligence reads.**

### Inputs available for v2 (already in Prisma schema)

- `SavingsRule` (`id`, `name`, `type`, `isActive`, `config`) and `RuleAllocation` (`ruleId`, `goalId`, `weight`).
- `FinancialTransaction` (`direction`, `categoryName`, `subcategory`, `isTransfer`, `postedAt`, `amount`) — already canonical ledger; safe to read for trailing 30d discretionary outflow share.
- `TransactionCategoryKind` (`INCOME` | `EXPENSE` | `TRANSFER`) — no first-class "discretionary" flag; v2 will use a fixed, reviewable name pattern set (auditable) instead of inventing a new schema field.

### V2 risks to avoid

- **Health score creep.** New discretionary factor must remain *binary* and gated by an existing low-balance / allocation pressure signal so it never fires in isolation.
- **Discretionary category labelling drift.** Use an explicit, code-visible pattern list. Do not hide labelling logic in a magic constant.
- **Goal action accuracy.** `OPEN_OPERATIONAL_GOAL` actions must be sourced from the same `OperationalGoal` rows used in the snapshot (no second query / different sort).
