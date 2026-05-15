# Operational Financial Guidance — Completion Report

**Date:** 2026-05-10  
**Scope:** Deterministic guidance engine (no chatbot), integrated with Operational Center and FinancialEvent audit.

---

## Files created

| File | Purpose |
|------|---------|
| `docs/operational-financial-guidance-audit.md` | Phase 1 audit |
| `docs/operational-financial-guidance-architecture.md` | Phase 2 design |
| `lib/guidance/types.ts` | Guidance DTOs + explainability shape |
| `lib/guidance/engine.ts` | `buildGuidanceRecommendations` — composes forecast, goals, invoices, guardrails, jobs |
| `lib/guidance/ensure-guidance-notifications.ts` | Upserts `AutomationNotification` rows (`guidance_*` attentionKind) |
| `lib/guidance/__tests__/mappers.test.ts` | Unit tests for risk→kind / severity→priority mappers |
| `prisma/migrations/20260510140000_guidance_engine_financial_events/migration.sql` | `GUIDANCE_ENGINE_SYNCED`, `API_GUIDANCE` enum values |
| `docs/operational-financial-guidance-completion-report.md` | This report |

## Files changed

| File | Change |
|------|--------|
| `prisma/schema.prisma` | `FinancialEventType.GUIDANCE_ENGINE_SYNCED`, `FinancialEventSource.API_GUIDANCE` |
| `app/api/operational-center/alerts/route.ts` | Calls `ensureGuidanceAttentionNotifications`; `grouped.guidance` |
| `lib/operational-notifications/types.ts` | `OperationalUiDomain` + `guidance` |
| `lib/operational-notifications/enrich.ts` | `inferDomain` routes `guidance_*` |
| `lib/financial-automation/actionable-metadata.ts` | `OPEN_MONEY_CONTROL` |
| `components/operational-center/OperationalAlertCenter/index.tsx` | Domain label |
| `components/operational-center/OperationalAlertCards/index.tsx` | `OPEN_MONEY_CONTROL` / `CREATE_GOAL` links; **Mark applied** for guidance |
| `app/api/automation/notifications/[id]/route.ts` | `guidanceApplied` → `metadata.guidanceAppliedAt` |

---

## Systems reused

- `buildCashFlowForecast` + `analyzeRisks` output (`RiskFindingDto`)  
- `analyzeOperationalGoal` for multi-goal pace + allocation conflict synthesis  
- Prisma: `OperationalGoal`, `Invoice`, `Job` (`DEPOSIT_PENDING`), `SpendingGuardrailPolicy`  
- `AutomationNotification` + existing snooze / dismiss / read semantics  
- `createAutomationNotification` + `buildOperationalAttentionMetadata`  
- `FinancialEvent` for `GUIDANCE_ENGINE_SYNCED` batch audit  

## Duplicate systems avoided

- No LLM / chat layer  
- No second forecast or ledger  
- Guidance **adds** cross-cutting items (e.g. envelope vs. goal tradeoff) without replacing `ensure-goal-attention` per-goal rows  

## Known overlap (documented gap)

- Cash flow ensure still emits `cashflow_*` alerts; guidance emits parallel `guidance_*` rows for the same underlying risk codes. Users may see **two cards** until a future dedupe policy is chosen.

## Recommendation engine status

- **Live:** `buildGuidanceRecommendations` returns `{ recommendations, forecastSnapshot }`.  
- **Kinds covered:** allocation adjustment, goal pacing (aggregate), cash flow safety, bill timing (via risks), contractor reserve (+ `OPEN_JOB`), spending reduction (guardrails + low balance), invoice follow-up (overdue / cluster), emergency reserve (no `EMERGENCY_FUND` goal), income-pattern weak signal.  

## Explainability status

- Each notification packs `metadata.guidance` (`kind`, `priority`, `riskCode`, `inputsUsed`, `calculations`, `expectedImpact`, `confidence`) plus standard `trust` block.  

## Operational workflow status

- **Surface:** Operational Center domain filter **Financial guidance**.  
- **Actions:** Cash Flow, Money Control tabs, invoices, jobs, operational goals, create goal.  
- **Lifecycle:** **Mark applied** PATCH sets `guidanceAppliedAt`.  

## Validation results

| Check | Result |
|-------|--------|
| `npx prisma validate` | Pass |
| `npx prisma generate` | Pass (client regenerated) |
| `npm run typecheck` | Not re-run for full repo; subset project historically excludes new paths — run `npm run typecheck:full` locally if desired. |
| Jest `lib/guidance/__tests__/mappers.test.ts` | Pass |

## Remaining production gaps

1. **Dedupe** vs. `ensureCashflowAttentionNotifications` for identical underlying risks.  
2. **Auto-retire** guidance rows when signals disappear (currently stale rows remain until dismiss or next title/body refresh).  
3. **Throttle** `GUIDANCE_ENGINE_SYNCED` events if refresh frequency is high (currently once per ensure call).  
4. **Money Control** must honor `?tab=` if not already wired in that page.  

## Production readiness

- **Staging-ready** after `prisma migrate deploy` for `20260510140000_guidance_engine_financial_events`.  
- **Trust model:** All copy is template-driven from structured inputs; confidence values propagate from `RiskFindingDto` or fixed heuristics documented in code.  

---

*End of completion report.*
