# Operational Financial Guidance — Phase 1 Audit

**Scope:** Map systems that can feed a **deterministic, explainable** guidance layer without duplicating forecast, ledger, or attention queues. No generic chatbot; no free-form “AI advice.”

**Date:** 2026-05-10

---

## 1. Existing reusable systems

| System | Location | Reuse for guidance |
|--------|----------|---------------------|
| **Cash flow forecast** | `lib/cashflow/forecast.ts` → `buildCashFlowForecast` | Single source for windows, obligation/income patterns, `risks[]`, `explain` payload. |
| **Risk analysis** | `lib/cashflow/risk.ts` → `analyzeRisks` | Codes: `PROJECTED_LOW_BALANCE`, `BILLS_BEFORE_NEXT_INCOME`, `BILL_CLUSTER`, `ALLOCATION_PRESSURE`, `INVOICE_RECEIVABLE_GAP`, `DEPOSIT_RUNWAY_WARNING`. |
| **Explainability** | `lib/cashflow/explain.ts` → `buildExplainPayload` | Assumptions, `inputsUsed`, pattern/ledger-driven **confidence** label. |
| **Goal analysis** | `lib/goals/analyze.ts` | Pace vs. trailing allocations vs. forecast drag; structured `findings[]` + `summaryExplain`. |
| **SmartAllocation / SmartBucket** | Prisma + `lib/financial-automation/allocation-persistence.ts` | Trailing allocation pace in forecast; bucket balances for goals. |
| **AutomationRule / guardrails** | `lib/financial-automation/rules-engine.ts`, `SpendingGuardrailPolicy` | GUARDRAIL rules emit `FinancialEvent` + notifications; category limits exist for spending context. |
| **FinancialTransaction** | Prisma | Ledger for recurrence detection inside forecast (not reimplemented in guidance). |
| **Operational goals** | `OperationalGoal`, `lib/goals/*` | Emergency-fund gap checks; cross-signals with forecast. |
| **Jobs / invoices** | Prisma models; `lib/operational-notifications/ensure-attention.ts` | Deposit-pending jobs in `analyzeRisks`; invoice due/overdue attention patterns. |
| **Operational Center** | `app/api/operational-center/alerts`, `lib/operational-notifications/enrich.ts`, `OperationalAlertCards` | **Canonical attention UX**: snooze, dismiss, read, actions, trust blocks. |
| **AutomationNotification** | Prisma | Operational queue rows; metadata `attentionKind`, `trust`, `actions`. |
| **FinancialEvent** | `lib/financial-events/events.ts` | Audit trail for sync/generation events. |
| **Actionable metadata** | `lib/financial-automation/actionable-metadata.ts` | Typed client actions (`OPEN_CASH_FLOW`, `OPEN_OPERATIONAL_GOAL`, etc.). |

---

## 2. Existing forecasting / risk systems

- **Deterministic projection:** 7/14/30d windows, bill expansion, invoice due inflows, allocation drag from trailing 28d `SmartAllocation` sum ÷4 ÷7.  
- **Risk DTO:** `RiskFindingDto` with `code`, `severity`, `summary`, `detail`, numeric `confidence` 0–1.  
- **Goal risks:** Overlapping but **entity-scoped** (`ensure-goal-attention` → `GOAL_*` notification types).

---

## 3. Existing explainability systems

- Cash flow **`explain`** object (assumptions + inputs + confidence tier).  
- Operational **`OperationalTrustDto`** (`why`, `whatChanged`, `recommendedNextStep`, `sourceEventType`) packed in notification metadata.  
- Goal findings carry **`explain[]`** strings tied to formulas (pace, drag, thresholds).

---

## 4. Existing operational workflows

- **Ensure pattern:** `ensureCashflowAttentionNotifications`, `ensureGoalPlanningAttentionNotifications`, `ensureOperationalAttentionNotifications` — idempotent upsert by `attentionKind`.  
- **Lifecycle:** `PATCH /api/automation/notifications/[id]` — `markRead`, `snoozeHours`, `dismiss`.  
- **Domain routing:** `inferDomain` maps `attentionKind` / entity types to `OperationalUiDomain`.

---

## 5. Existing alert systems

- **Types:** `AutomationNotificationType` includes cash-adjacent and `GOAL_*` types; many business alerts use `AUTOMATION_ACTION` + `attentionKind`.  
- **Correlation:** Latest `FinancialEvent` by related entity stitched into DTO for trust context.

---

## 6. Duplication risks (to avoid)

| Risk | Mitigation |
|------|------------|
| Second forecast engine | Guidance **only consumes** `buildCashFlowForecast` + goal analyzer outputs. |
| Duplicate goal alerts | Guidance emits **cross-cutting** items (e.g. tradeoff between envelope drag and multiple goals), not per-goal clones of `ensure-goal-attention`. |
| Chat / LLM “tips” | No OpenAI path in scope; all strings template from structured inputs. |
| Parallel recommendation store | Use **`AutomationNotification` + `attentionKind` prefix `guidance_`** for persistence and existing UX. |

---

## 7. Missing guidance workflows (pre-implementation)

- **Unified prioritization** across forecast risks, goals, invoices, and guardrails.  
- **Explicit explainability block** (inputs + calculations + expected impact) in metadata for every guidance row.  
- **Synthetic rules** (e.g. low balance + no emergency `OperationalGoal`) not covered by a single subsystem.  
- **Lifecycle** “applied” flag for guidance-specific follow-up (optional extension to notification PATCH).

---

## 8. Recommended source-of-truth architecture

1. **`lib/guidance/engine.ts`** — Deterministic `buildGuidanceRecommendations(userId)` assembling signals from forecast, goals, invoices, guardrails.  
2. **`lib/guidance/ensure-guidance-notifications.ts`** — Upsert `AutomationNotification` rows (`AUTOMATION_ACTION`, `guidance_*` attentionKind, rich metadata).  
3. **Operational Center** — New UI domain **`guidance`**; existing cards render trust + actions.  
4. **FinancialEvent** — `GUIDANCE_ENGINE_SYNCED` (+ `API_GUIDANCE` source) once per successful sync for audit.  
5. **Notification PATCH** — Optional `guidanceApplied` for user-marked follow-through.

---

## 9. Safe implementation strategy

1. Land audit + architecture docs.  
2. Implement engine with **pure, testable** mappers from `RiskFindingDto` + small Prisma reads.  
3. Wire `ensureGuidanceAttentionNotifications` into operational alerts `ensure` chain **after** cashflow + goals (order: operational invoices → cashflow → goals → **guidance**).  
4. Extend `OperationalUiDomain`, `inferDomain`, grouped API response.  
5. Add `OPEN_MONEY_CONTROL` action for rules/buckets/review deep links.  
6. `prisma validate` / `generate`; targeted Jest for mappers; document full-project typecheck caveats in completion report.

---

## Files sampled for this audit

- `lib/cashflow/forecast.ts`, `risk.ts`, `explain.ts`, `ensure-cashflow-attention.ts`  
- `lib/goals/analyze.ts`, `ensure-goal-attention.ts`  
- `lib/operational-notifications/*`, `app/api/operational-center/alerts/route.ts`  
- `lib/financial-automation/rules-engine.ts`, `actionable-metadata.ts`  
- `app/api/automation/notifications/[id]/route.ts`  
- `prisma/schema.prisma` (FinancialEvent, AutomationNotification)

---

*End of Phase 1 audit.*
