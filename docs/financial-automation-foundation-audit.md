# Financial Automation Foundation Audit

## Scope

This audit covers existing systems related to:

- Plaid/bank connection architecture
- Transaction, income, and expense storage
- Budgeting, allocation, and guardrails logic
- Automation and notification trigger infrastructure
- FinancialEvent integration
- Income profile activation architecture
- Premium gating and settings/preferences
- Recurring expense/transaction patterns
- SmartRulesEngine/guardrails references
- Migration leftovers and duplication risk

Reviewed areas include:

- `prisma/schema.prisma`
- `app/api/income/**`
- `app/api/expenses/**`
- `app/api/plaid/**` and `app/api/bank/**`
- `app/api/financial-events/**`
- `app/api/guardrails/**`
- `app/api/notifications/**`
- `app/api/smart-saving/**`
- `lib/financial-events/**`
- `lib/jobs/revenue.ts`
- `lib/income-profiles/**`
- `components/money/**`, `components/budget/**`, `components/guardrails/**`, `components/notifications/**`
- `config/nav-links.ts`
- production-readiness and completion/audit docs in `docs/**`

---

## 1) Existing Reusable Systems

### Auth, ownership, and validation

- Strong route-level auth pattern exists in multiple financial APIs via `requireAuthSession` (`lib/api/require-auth.ts`).
- Zod validation is already established in core financial routes (`expenses`, `invoices`, `financial-events/timeline`, selected bank routes).
- Ownership checks exist in several canonical CRUD paths (expense/invoice/job-related operations).

### Canonical activity/event stream

- `FinancialEvent` model and enums in `prisma/schema.prisma` are production-grade and reusable.
- `createFinancialEventSafe` in `lib/financial-events/events.ts` is already used by real workflows (expenses, invoices, jobs, income-profile actions).
- Timeline query path (`lib/financial-events/query.ts` + `app/api/financial-events/timeline/route.ts`) is a strong central source for activity history.

### Revenue and financial recomputation

- `lib/jobs/revenue.ts` provides reusable, deterministic recomputation logic for job-level financial state.
- Invoices/expenses already call recompute logic and emit aligned FinancialEvents.

### Income profile activation

- `UserIncomeProfile` model and activation resolver (`lib/income-profiles/activation.ts`) are real and reusable.
- Activation API patterns exist (`/api/income-profiles`, `/api/income-profiles/activation`) and are suitable feature-gating inputs for automation rollout.

### Smart-saving foundation

- `app/api/smart-saving/{summary,rules,income-split,execute}` and SaveEngine-backed flows provide partial production automation substrate.
- This can be extended into a generalized rules/allocations engine if consolidated.

---

## 2) Existing Fake/Placeholder Systems

- Plaid connection status (**updated**): **`/api/bank/exchange-token`** persists encrypted tokens and accounts; **`/api/bank/transactions`** reads linked accounts when connections exist. Older audits assumed **501**/empty responses — treat those as historical unless regressions are observed.
- Generic transactions write API appears intentionally unimplemented (`501` behavior in transaction route surface).
- Notification surface contains partial/misaligned implementation:
  - references that do not fully match current Prisma relations in some service paths.
- Multiple dashboard financial widgets still run on mock/local/static data and are disconnected from canonical APIs.
- Category/tag hook systems include mock return values and are not canonical financial categorization engines.

Operational risk: these placeholders create perception of automation coverage without real execution guarantees.

---

## 3) Existing Transaction Architecture

Current state is split:

- **Real financial writes** happen in domain tables (`Expense`, `Invoice`, `Job`, `Income`, plus related entities).
- **Canonical activity chronology** is represented in `FinancialEvent`.
- **Bank transaction ingestion** is not yet persisted as a first-class canonical source.
- **Dashboard activity compatibility endpoints** still include legacy booking-style pseudo-transaction outputs in some routes.

Strengths:

- Evented architecture already exists for financial mutations.
- Route-level auth and Zod validation are present in many modern APIs.

Gaps:

- No single canonical transaction ledger model spanning manual + synced + transfer-detected flows.
- Parallel/legacy endpoints can produce inconsistent financial views.

---

## 4) Existing Budgeting Architecture

- Guardrails and budget-related endpoints exist (`app/api/guardrails/**` and smart-saving routes).
- UI and API are unevenly integrated:
  - some guardrail/budget components are DB-backed but not consistently wired into active dashboard workflows.
  - some budget widgets are static or mock.
- 40/30/30 logic appears in calculator/marketing-facing experiences and is not yet the canonical backend allocation engine for all users.

Conclusion: building blocks exist, but allocation/budgeting logic is not yet unified around one execution engine.

---

## 5) Existing Notification Architecture

- Notification APIs/services exist, but current architecture is fragmented.
- FinancialEvent is present as a central event source, but notification triggers are not consistently downstreamed from it.
- Some notification service references indicate schema/relation drift, suggesting incomplete migration hardening.

Conclusion: notification capability exists, but production automation triggers should be centralized from FinancialEvent + rule evaluations.

---

## 6) Existing Automation Logic

- Present and reusable:
  - Smart-saving execution endpoints and rule persistence.
  - Job revenue recompute hooks.
  - Stripe webhook automation for invoice/payment lifecycle.
- Missing/partial:
  - Unified cross-domain trigger-condition-action engine for allocations, guardrails, subscriptions, and bill reminders.
  - One canonical scheduler/retry policy for recurring and sync-triggered automations.

---

## 7) Existing Recurring Transaction Logic

- Recurring metadata fields exist on expenses (`isRecurring`, `frequency`, `nextDueDate`) and are accepted by API/UI paths.
- No clear centralized recurring execution pipeline was found in audited financial backend paths.
- Recurring bills/calendar-like user value exists conceptually, but execution-level orchestration (run loop, retries, dedupe, events) is not yet canonicalized.

Conclusion: recurring is currently modeled more than automated.

---

## 8) Existing Category Systems

- Expense records include category fields and are persisted in canonical expense APIs.
- Import/category helper logic exists in backend utility surfaces.
- Category/tag hooks also exist in mock/local patterns, introducing ambiguity over source of truth.

Conclusion: category persistence exists, but category management/categorization logic is fragmented between real and mock paths.

---

## 9) Existing Premium Feature Gating

- Premium concepts exist (tiers, trial logic, nav badge signaling, route/page-level checks in places).
- Gating logic is duplicated across modules and inconsistently enforced at API boundaries.
- UI badges (`Pro`) are not equivalent to enforceable backend entitlements.

Conclusion: premium gating is present but not yet a single policy-enforced contract for automation capabilities.

---

## 10) Duplication Risks

High-risk duplication and drift identified:

1. **Parallel route variants**
   - `route.ts` + `route-cached.ts` patterns in financial domains (expenses/invoices) risk behavioral divergence.

2. **Dual/legacy income semantics**
   - income calculations differ across endpoints (booking-derived vs direct financial models), causing reporting inconsistencies.

3. **Auth pattern drift**
   - mixed auth option imports and session guard patterns may create subtle access inconsistencies.

4. **Premium policy duplication**
   - multiple tier-validation utilities can diverge over time.

5. **Smart-saving data-layer split**
   - runtime switching patterns for data adapters increase divergence risk in financial-critical workflows.

6. **Placeholder + production coexistence**
   - mock widgets and partially disconnected components can mask real operational gaps.

7. **Schema-contract drift**
   - some API/service references do not align with current Prisma relations/fields, risking runtime failures.

---

## 11) Recommended Canonical Source-of-Truth Architecture

### A. Canonical data sources

- **Financial activity chronology:** `FinancialEvent` only.
- **Income/expense/invoice state:** Prisma domain models (`Income`, `Expense`, `Invoice`, `Job`) with strict ownership.
- **Automation policy state:** unified rules engine tables (trigger/condition/action/schedule/status).
- **Bank connectivity/sync:** dedicated bank connection + account + transaction ingestion models (Prisma) with encrypted secrets.

### B. Canonical execution flow

1. Trigger enters system (bank webhook, scheduled job, manual mutation, payment webhook).
2. Validate auth ownership and payload (Zod).
3. Persist normalized mutation in canonical model.
4. Emit `FinancialEvent`.
5. Run rule engine evaluation (guardrails/allocation/notifications).
6. Persist automation outcomes and emit resulting FinancialEvents.

### C. Canonical platform constraints

- One auth guard pattern for all financial APIs.
- One premium entitlement policy module.
- One recurring scheduler/executor.
- One transaction ingestion path (manual/synced normalized to same model).
- One notification trigger bus sourced from FinancialEvent + rule outcomes.

---

## 12) Safe Migration/Consolidation Strategy

### Phase A — Lock canonical contracts (no behavior changes)

- Publish a source-of-truth matrix:
  - FinancialEvent = timeline
  - Domain models = balances/records
  - Rules engine = automation decisions
- Mark legacy endpoints as deprecated with explicit comments/telemetry.

### Phase B — Consolidate reads first

- Move dashboard/activity consumers to `financial-events/timeline`.
- Keep temporary compatibility shims to reduce breakage risk.

### Phase C — Consolidate financial writes

- Standardize all writes to:
  - `requireAuthSession`
  - Zod schema
  - ownership filter
  - FinancialEvent emission
  - recompute/invalidation hook where applicable

### Phase D — Remove duplicate paths

- Retire `route-cached.ts` financial variants after telemetry confirms no active consumers.
- Remove stale backup/migration leftovers that can reintroduce drift.

### Phase E — Enable real bank automation foundation

- Add Prisma models for bank institutions/accounts/item-link state/sync checkpoints.
- Persist encrypted Plaid tokens and account metadata.
- Implement robust transaction sync + dedupe + retry + webhook handling.
- Normalize synced transactions into canonical transaction model.

### Phase F — Launch rules/guardrails/notifications as one pipeline

- Introduce unified rules engine contract:
  - trigger
  - condition
  - action
  - schedule
  - enabled
  - user ownership
- Pipe all automation outcomes into FinancialEvent.
- Gate premium-only rule capabilities at API enforcement layer.

### Phase G — Production hardening gates

- Security: encrypted token handling, strict ownership checks, idempotency for sync/webhook writes.
- Integrity: duplicate transaction protections and loop-prevention in automations.
- Operational: retry/backoff/dead-letter for sync and automation jobs.
- Validation: enforce `prisma validate`, `prisma generate`, and full typecheck in CI.

---

## Audit Summary

StackZen has strong foundational primitives already in production (Prisma financial models, FinancialEvent, auth guard patterns, event-capable financial routes, and revenue recomputation). The largest risks are not missing ideas, but **architectural drift**: duplicated route variants, mixed source-of-truth calculations, partially wired automation surfaces, and unfinished migration leftovers.

The safest path is consolidation-first: unify sources of truth and execution patterns before introducing new automation complexity.
