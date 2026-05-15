# Goal Planning & Automation — Phase 1 Audit

**Scope:** Map existing StackZen systems that operational goals must reuse. No duplicate ledgers, buckets, or allocation engines.

**Date:** 2026-05-10

---

## 1. Existing reusable systems

| System | Location / entry | Role for goals |
|--------|------------------|----------------|
| **Prisma ORM** | `prisma/schema.prisma` | Canonical persistence; extend with `OperationalGoal` rather than parallel “goal” stores. |
| **FinancialTransaction** | `model FinancialTransaction` | Canonical money ledger for bank-synced activity; goal *contributions* are modeled as **SmartAllocation** into goal-linked buckets (not synthetic ledger rows unless tied to real tx later). |
| **SmartBucket** | `model SmartBucket`, `app/api/automation/smart-buckets`, `app/api/smart-saving/buckets` | **Source of truth for goal balance progress** when each goal links one bucket. |
| **SmartAllocation** | `model SmartAllocation`, `lib/financial-automation/allocation-persistence.ts` | Records envelope movements; automation uses `source` + optional `financialTransactionId`. Goals use dedicated `OPERATIONAL_GOAL:{goalId}` source strings. |
| **AutomationRule / rules engine** | `lib/financial-automation/rules-engine.ts`, `app/api/automation/rules` | Transaction-triggered allocation; goals **reuse buckets** and can later reference rules in metadata—no second allocation engine. |
| **Cash flow forecast** | `lib/cashflow/forecast.ts` → `buildCashFlowForecast` | Deterministic windows, bills, allocation drag, `risks[]`, `explain` — used for **goal risk** and “unsafe contribution” signals. |
| **FinancialEvent** | `lib/financial-events/events.ts` | Audit trail for goal lifecycle and contributions (`GOAL_*` event types). |
| **AutomationNotification** | `model AutomationNotification`, `createAutomationNotification` | Operational attention queue; extended with `GOAL_*` notification types. |
| **Operational Center** | `app/api/operational-center/alerts`, `components/operational-center/*`, `lib/operational-notifications/*` | Unified alert UX; **goal ensure** runs alongside cashflow ensure. |
| **Money Control** | `components/money-control`, automation bucket APIs | Users adjust envelopes; goal UI links to buckets / cash flow. |
| **Premium gating** | `hasAdvancedAutomationAccess` on automation routes | Documented for future tightening of non-manual goal automation modes; baseline implementation keeps modes available. |

---

## 2. Existing allocation systems

- **Automation allocations:** `replaceAutomationAllocationsForTransaction` — idempotent per rule + `financialTransactionId`.
- **Income split / smart saving:** `app/api/smart-saving/*`, `DatabaseService` — percentage splits into buckets; separate from goal engine but **same bucket model**.
- **SavingsExecution / SavingsRule:** Older path used by `saveEngine`; still present; goals **do not** add another execution table.

**Conclusion:** All goal contributions flow through **SmartAllocation + SmartBucket** updates in one transaction.

---

## 3. Existing bucket systems

- `SmartBucket`: `name`, `type`, `targetAmount`, `currentAmount`, etc.
- Automation envelopes use `type = AUTOMATION_ENVELOPE` (`allocation-persistence.ts`).
- Goals use **`type = GOAL_FUND`** for auto-created buckets to avoid colliding with automation envelope naming.

---

## 4. Existing forecasting integrations

- `buildCashFlowForecast(userId, { includeDetails })` returns `risks`, `windows`, `explain`.
- `ensureCashflowAttentionNotifications` maps `forecast.risks` → notifications.
- Goals reuse the same forecast for **allocation pressure** and **deadline feasibility** heuristics in `lib/goals/*`.

---

## 5. Existing operational workflows

- **Ensure pattern:** `ensureOperationalAttentionNotifications`, `ensureCashflowAttentionNotifications` — idempotent upsert by `metadata.attentionKind`.
- **Enrichment:** `lib/operational-notifications/enrich.ts` maps notification → DTO + domain.
- **Actions:** `AutomationClientAction` in `actionable-metadata.ts` — extended with `OPEN_OPERATIONAL_GOAL`.

---

## 6. Duplication risks (avoided)

| Risk | Mitigation |
|------|------------|
| Second “savings balance” table | Progress = linked **SmartBucket.currentAmount** (capped to target). |
| Duplicate allocation writes | Single `recordGoalContribution` helper. |
| Disconnected progress bars | UI reads bucket + goal metadata from API; shows **explain** payload from analyzer. |
| Parallel notification system | Reuse `AutomationNotification` + Operational Center. |

---

## 7. Missing goal-planning workflows (before implementation)

- No **operational** goal model linking bucket + automation mode + priority.
- No **forecast-aware** goal risk loop in Operational Center.
- No **user actions**: pause, reprioritize, manual contribution, analysis endpoint with explanations.
- Legacy **`FinancialGoal`** / **`SavingsGoal`** remain for older UX; **new** work uses `OperationalGoal` to avoid breaking legacy callers.

---

## 8. Recommended source-of-truth architecture

1. **`OperationalGoal`:** intent (kind, target, deadline, automation config, status, priority).
2. **`SmartBucket` (linked):** balance truth for that goal’s fund.
3. **`SmartAllocation`:** every contribution row with `source = OPERATIONAL_GOAL:{id}`.
4. **`buildCashFlowForecast`:** inputs to risk and explainability.
5. **`FinancialEvent` + `AutomationNotification`:** audit + attention.

---

## 9. Safe implementation strategy

1. Add schema + migration (enums, `OperationalGoal`, optional `SmartAllocation.financialTransactionId` sync if missing).
2. Implement `lib/goals/*` (constants, analyze, apply contribution, ensure attention).
3. Expose authenticated API routes; wire Operational Center `ensure`.
4. Ship `/goals/operational` UI (actions, not passive cards only).
5. Run `prisma validate`, `prisma generate`, `npm run typecheck`.
6. Record gaps in completion report (e.g. auto round-up execution on Plaid tx — future rules-engine hook).

---

## Files reviewed (audit sampling)

- `prisma/schema.prisma` — core models and enums  
- `lib/financial-automation/allocation-persistence.ts`, `rules-engine.ts`, `actionable-metadata.ts`  
- `lib/cashflow/forecast.ts`, `ensure-cashflow-attention.ts`  
- `lib/operational-notifications/*`, `app/api/operational-center/alerts/route.ts`  
- `app/api/automation/smart-buckets/route.ts`, `components/operational-center/OperationalAlertCenter/index.tsx`  
- `config/nav-links.ts`  

---

*End of Phase 1 audit.*
