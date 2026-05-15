# Smart allocation & reserve automation — completion report

## Spec delivery checklist (Phases 1–5)

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 1 | `docs/smart-allocation-reserve-automation-audit.md` (systems, risks, gaps, strategy) — including v2 audit refresh section | Done |
| 2 | `docs/smart-allocation-reserve-automation-architecture.md` (deterministic design, hub bundle) — including v2 additions section | Done |
| 3 | Reserve intelligence lib, API, alerts ensure, workspace panel, shared forecast with contractor — plus v2 (discretionary pressure, SavingsRule visibility, top-underfilled goals, goal-specific deep links) | Done |
| 4 | `prisma validate` / `typecheck` / scoped Jest passes (see table below); `prisma generate` blocked by environmental Windows file lock noted in v1 — unchanged | Done / noted |
| 5 | This completion report | Done |

**Interpretation:** “Reserve execution” is **operational** — pressure factors, guidance, portfolio `AutomationNotification`, links to Money Control / Goals / operational-actions preview+apply — **not** autonomous ledger or rule mutation.

## Files audited

See `docs/smart-allocation-reserve-automation-audit.md` (SmartAllocation, SmartBucket, AutomationRule, SavingsRule, RuleAllocation, forecast, goals, guidance, contractor ops, operational actions, Money Control, notifications, `FinancialEvent` references, `FinancialTransaction` for discretionary outflow analysis).

## Files added (v1)

| Path | Purpose |
|------|---------|
| `docs/smart-allocation-reserve-automation-audit.md` | Phase 1 audit |
| `docs/smart-allocation-reserve-automation-architecture.md` | Phase 2 design |
| `docs/smart-allocation-reserve-automation-completion-report.md` | This report |
| `lib/reserve-allocation-intelligence/types.ts` | Snapshot DTOs |
| `lib/reserve-allocation-intelligence/pressure.ts` | Deterministic factors + guidance rows |
| `lib/reserve-allocation-intelligence/snapshot.ts` | `buildReserveAndContractorIntelligenceBundle`, `buildReserveAllocationSnapshot`, `isElevatedReservePressure` |
| `lib/reserve-allocation-intelligence/ensure-attention.ts` | `reserve_alloc_ops_elevated_pressure` notification |
| `lib/reserve-allocation-intelligence/__tests__/pressure.test.ts` | Pure unit tests |
| `app/api/operational-center/reserve-allocation-intelligence/route.ts` | GET snapshot + optional ensure |
| `components/operational-workspace/ReserveAllocationIntelligencePanel/*` | Workspace UI + Jest + Storybook |
| `lib/operational-notifications/dedupe-key.ts` | Dedupe for `reserve_alloc_ops_*` |
| `lib/operational-notifications/enrich.ts` | Domain mapping for `reserve_alloc_ops_*` |

## Files added (v2 continuation pass)

| Path | Purpose |
|------|---------|
| `lib/reserve-allocation-intelligence/discretionary.ts` | Pure helpers: `DISCRETIONARY_CATEGORY_PATTERNS`, `computeDiscretionaryOutflowStats`, `isDiscretionaryPressure` |

## Files changed (v2)

| Path | Change |
|------|--------|
| `lib/reserve-allocation-intelligence/types.ts` | Added `topUnderfilledReserveGoals`, `discretionaryOutflowStats`, `savingsRulesContext` to snapshot DTO |
| `lib/reserve-allocation-intelligence/pressure.ts` | Added gated `DISCRETIONARY_SPEND_PRESSURE` factor, `selectTopUnderfilledReserveGoals`, `TRIM_DISCRETIONARY_OUTFLOWS` guidance row |
| `lib/reserve-allocation-intelligence/snapshot.ts` | Queries `SavingsRule` count + active sample, queries trailing 30d `FinancialTransaction` discretionary OUTFLOW rows; explainability now lists the new assumptions and inputs |
| `lib/reserve-allocation-intelligence/ensure-attention.ts` | Notification actions now include up to 2 `OPEN_OPERATIONAL_GOAL` deep links for under-filled reserve goals; `CREATE_GOAL` is only appended when no goals are under-filled; metadata carries `underfilledReserveGoalIds`, `discretionaryShare`, `enabledSavingsRuleCount` |
| `lib/reserve-allocation-intelligence/__tests__/pressure.test.ts` | Adds coverage for gated discretionary pressure, `selectTopUnderfilledReserveGoals`, and discretionary stats fixture |
| `components/operational-workspace/ReserveAllocationIntelligencePanel/index.tsx` | Renders SavingsRule sample, discretionary share, and a per-goal "Open goal" list for the top under-filled reserves |
| `components/operational-workspace/ReserveAllocationIntelligencePanel/ReserveAllocationIntelligencePanel.test.tsx` | Updated fixture matches v2 DTO and asserts new fields render |
| `docs/smart-allocation-reserve-automation-audit.md` | Appended v2 audit refresh section |
| `docs/smart-allocation-reserve-automation-architecture.md` | Appended v2 additions section |
| `jest.config.ts` | `modulePathIgnorePatterns` now skips stale `prisma/.generated/client*` artifacts so haste-map does not crash on Windows during local Jest runs |

## Systems reused (v1 + v2)

- `buildCashFlowForecast` + `analyzeRisks` risk codes and weekly allocation explain string.
- `buildContractorFinancialOpsSnapshot(userId, { forecast })` for aligned contractor stress (no second forecast).
- `OperationalGoal` + `SmartBucket` balances for reserve under-fill heuristic and the v2 top-underfilled deep-link source.
- `AutomationRule` count (`ALLOCATION`, `enabled`) for automation-active factor when modeled drag > 0.
- **v2 new:** `SavingsRule` count + active sample, surfaced as **separate** read-only context (never merged into the AutomationRule allocation count).
- **v2 new:** `FinancialTransaction` (OUTFLOW + non-transfer) for trailing 30d discretionary share — same canonical ledger, no schema flag introduced.
- `AutomationNotification` + `buildOperationalAttentionMetadata` + `createAutomationNotification` (same pattern as contractor ops). v2 expands the `actions[]` array deterministically; the dedupe key is unchanged.
- Existing operational financial actions (`ensureOperationalActionProposals`, preview/apply) are **still** the only mutation path.

## Duplicate systems avoided

- No second allocation engine: weekly pace and drag come only from forecast explain / windows.
- No autonomous `AutomationRule` or `SavingsRule` edits or transfers.
- No synthetic “health score”: `pressureScore` is **factor count** only.
- **v2:** discretionary pressure does not fire on its own — it is gated by an existing forecast / allocation factor, so the snapshot still cannot manufacture alarm noise out of categorization alone.
- **v2:** no new schema field for "discretionary"; matching is an explicit, code-visible pattern list with reasoning surfaced into the factor.

## Feature status

| Capability | Status |
|------------|--------|
| Reserve pressure analysis | `buildReservePressureFactors` + snapshot (v1) extended with gated discretionary factor (v2) |
| Dynamic allocation guidance | Read-only `guidance[]` + links to Money Control / goals; v2 adds `TRIM_DISCRETIONARY_OUTFLOWS` row |
| Contractor reserve adaptation | Composed via shared-forecast contractor snapshot |
| Reserve operational alerts | `reserve_alloc_ops_elevated_pressure` when score ≥ 4 or critical low balance; v2 attaches `OPEN_OPERATIONAL_GOAL { goalId }` actions for the top under-filled reserve goals |
| Allocation action previews | Still **operational-actions** preview API; panel links to hub |
| Explainable reserve recommendations | Per-factor `reasoning`, snapshot `explain`, notification `trust` + `reserveAllocationIntel`; v2 metadata includes `underfilledReserveGoalIds`, `discretionaryShare`, `enabledSavingsRuleCount` |
| Operational reserve actions | User-driven via existing Money Control + operational actions (no new apply kinds in v2) |
| Forecast-linked allocation context | Single forecast instance threaded into contractor snapshot; hub uses one bundle for contractor + reserve ensures |
| Allocation rule visibility | `enabledAllocationRulesSample` (top by priority, read-only); v2 adds separate `savingsRulesContext.sample` |
| Discretionary spend visibility | **v2 new:** `discretionaryOutflowStats` (lookback, totals, top categories) on every snapshot |
| Under-filled reserve goal visibility | **v2 new:** `topUnderfilledReserveGoals[]` rendered in panel and used to build per-goal deep links |
| Operational Workspace visibility | `ReserveAllocationIntelligencePanel` with v2 sections |

## Validation results

| Command | Result |
|---------|--------|
| `npx prisma validate` | Passed |
| `npx prisma generate` | Failed in this session with the **pre-existing** Windows error `Unexpected end of JSON input` on `prisma/.generated/client/package.json` — same environmental issue documented in v1 (unrelated to reserve layer code) |
| `npm run typecheck` (scoped `tsconfig.typecheck.json`) | Passed |
| `npx jest lib/reserve-allocation-intelligence` | 12 / 12 passed (5 new v2 cases for gated discretionary factor, top-underfilled selection, discretionary stats) |
| `npx jest components/operational-workspace/ReserveAllocationIntelligencePanel` | 1 / 1 passed (v2 fixture asserts new fields render) |

### Phase 4 safety audit (manual)

- **Reserve / allocation correctness:** Factors derive only from `buildCashFlowForecast` risks/windows, `OperationalGoal`+`SmartBucket` progress, `AutomationRule` counts/samples, `SavingsRule` count/sample, the canonical `FinancialTransaction` ledger (for discretionary share), and `buildContractorFinancialOpsSnapshot` — no alternate allocation math, no second forecast, no second goal-pace engine.
- **Contractor alignment:** Shared `forecast` option on contractor snapshot; hub `buildReserveAndContractorIntelligenceBundle` avoids duplicate forecast+contractor work per refresh.
- **Ownership:** `requireAuthSession` on `reserve-allocation-intelligence` and `alerts` routes; all Prisma queries scoped by `userId` (`OperationalGoal`, `AutomationRule`, `SavingsRule`, `FinancialTransaction`).
- **Explainability:** Per-factor `reasoning`, snapshot `explain.assumptions` and `inputsUsed` (with the new v2 keys), notification `trust` + `reserveAllocationIntel` (now including `underfilledReserveGoalIds`, `discretionaryShare`, `enabledSavingsRuleCount`).
- **Operational safety:** No auto money movement; no silent rule edits; no `SavingsRule` mutation; apply paths remain `lib/operational-actions/*`. Discretionary factor cannot fire alone.
- **Determinism:** `selectTopUnderfilledReserveGoals` sorts by lowest progress with stable tie-break (name → id); `computeDiscretionaryOutflowStats` is pure and order-stable.

## Files changed (v3 — balance-delta persistence)

| Path | Change |
|------|--------|
| `lib/operational-actions/apply.ts` | `OPERATIONAL_FINANCIAL_ACTION_APPLIED` event metadata now persists `forecastSummaryBefore` and `forecastSummaryAfter` (full `ForecastSummaryDto`) alongside the existing `forecastBeforeAt` / `forecastAfterAt` timestamps. Apply response uses the same captured summaries — no extra forecast call. |
| `lib/workflow-resolution/types.ts` | New `AppliedActionBalanceDeltaDto`; `AppliedActionAggregateDto.latestBalanceDelta` carries deterministic before/after `lowestProjectedBalance30d` and `projectedEndingBalance30d` (USD), plus delta numbers and the source event id. |
| `lib/workflow-resolution/aggregate.ts` | `aggregateAppliedActions` now reads the persisted summaries from the latest applied event per kind and computes signed USD deltas. Backwards-compatible: events written before this upgrade return `latestBalanceDelta: null`. |
| `lib/workflow-resolution/snapshot.ts` | `explain.assumptions` documents the new metadata source and the null fallback rule for legacy events. |
| `components/operational-workspace/WorkflowResolutionPanel/index.tsx` | Renders "lowest projected balance shifted from $X → $Y" with signed delta and projected-ending delta per applied-action kind; falls back to an italic note when the event predates persistence. |
| `lib/workflow-resolution/__tests__/aggregate.test.ts` | Adds coverage that the latest applied event's summaries win and deltas are computed in USD. |
| `components/operational-workspace/WorkflowResolutionPanel/WorkflowResolutionPanel.test.tsx` | Fixture extended with a `latestBalanceDelta`; asserts the `+$250.00` USD shift renders. |

### v3 validation

| Command | Result |
|---------|--------|
| `npm run typecheck` | Passed |
| `npx jest lib/workflow-resolution/__tests__/aggregate.test.ts -t aggregateAppliedActions` | 3 / 3 passed (new balance-delta case included) |
| `npx jest components/operational-workspace/WorkflowResolutionPanel/WorkflowResolutionPanel.test.tsx` | 1 / 1 passed |

## Remaining production gaps

1. **Counterfactual allocation preview** — panel still does not simulate rule % changes; users continue to edit rules manually in Money Control. (Out of v2 scope — kept owned by `lib/operational-actions/*` proposals + preview to avoid duplicating apply paths.)
2. **Goal-specific deep link page contract** — v2 emits `OPEN_OPERATIONAL_GOAL { goalId }` actions; the existing `/goals/operational?goalId=` deep link in the panel assumes the page already focuses the requested goal when the query is present. If the page needs to consume the query string explicitly, follow up in the operational goals UI.
3. **SavingsRule deeper integration** — v2 surfaces presence/sample only; weighting these into a counterfactual "rule pause" preview is intentionally deferred.
4. **`prisma generate` Windows lock** — pre-existing local environmental issue (`prisma/.generated/client/package.json` empty); resolved at CI level. Local Jest now bypasses the stale tree via `modulePathIgnorePatterns`.
5. **Discretionary category coverage** — `DISCRETIONARY_CATEGORY_PATTERNS` is intentionally explicit; if a workspace surfaces additional category names that should be treated as discretionary, extend the patterns list (with the change tracked in source rather than via a schema-level flag).

## Production readiness assessment

**Ready for staged rollout** with CI validation: ownership-scoped API, deterministic factor math, gated discretionary signal, no ledger mutation from snapshot/ensure paths, portfolio alert complements existing `operational_action_*` proposals. The v2 changes add visibility (SavingsRule, discretionary share, under-filled goal list) and goal-specific deep links without introducing autonomous behavior, schema changes, or new mutation paths. Resolve local Windows file locks for `prisma generate` as needed; Jest haste-map now safely ignores the stale generator output.
