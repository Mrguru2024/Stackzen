# Automated Budget Workflow — Full Audit (Phase 1)

This document audits **existing** StackZen systems relevant to a real operational automated budgeting workflow. **No implementation** is described here beyond what already exists.

Audit date: aligned with current `prisma/schema.prisma`, `lib/financial-automation/*`, `lib/bank/*`, and related API routes.

---

## 1. Existing reusable systems

| Area | Primary location | Role today |
|------|------------------|------------|
| **Operational ledger (bank + automation)** | `FinancialTransaction` (+ `TransactionCategory`) | Upserted from Plaid sync, manual automation POST, expense mirror, Stripe paths; dedupe via `userId` + `dedupeHash`. |
| **Bank connection + sync** | `BankConnection`, `BankAccount`, `BankSyncJob`; `lib/bank/sync-runner.ts`, `POST /api/bank/sync` | Plaid `transactionsSync`; writes `FinancialTransaction` + `FinancialEvent` (`TRANSACTION_CREATED`, `BANK_SYNC_*`, `RECURRING_TRANSACTION_DETECTED` heuristic). |
| **Manual / import transactions** | `POST /api/automation/transactions`, `GET /api/automation/transactions` | Zod-validated create; category row created/linked; automation evaluated. |
| **Expense system (separate model, bridged to ledger)** | `Expense`; `app/api/expenses/route.ts` | Creates/updates `Expense` + mirrors to `FinancialTransaction` (dedupe by expense id); emits `EXPENSE_*` events; calls `evaluateAutomationForTransaction`. |
| **Automation engine (rules)** | `AutomationRule`, `AutomationExecution`; `lib/financial-automation/rules-engine.ts`; `app/api/automation/rules/route.ts` | On `TRANSACTION_POSTED`-style evaluation: runs `ALLOCATION`, `GUARDRAIL`, stubs others; writes executions + `FinancialEvent` (`AUTOMATION_RULE_*`). |
| **Guardrails (automation path)** | `SpendingGuardrailPolicy`; `app/api/automation/guardrails/route.ts` | Used **only** inside `GUARDRAIL` automation rule execution (spend vs `limitAmount`, cycle weekly/monthly). |
| **Envelope-style buckets** | `SmartBucket`, `SmartAllocation`; `app/api/smart-saving/buckets/route.ts` | CRUD/list buckets; **not** referenced from `rules-engine` allocation results today. |
| **Legacy smart-saving rules** | `SavingsRule`, `SavingsExecution`; `app/api/smart-saving/rules/route.ts` | Abstraction via `createDatabaseService()` — **parallel** to `AutomationRule` / Prisma-first automation path. |
| **Financial timeline / events** | `FinancialEvent`, `lib/financial-events/events.ts` | Central append-only event log; automation and bank/expense flows already integrate. |
| **Income activation (product)** | `lib/income-profiles/activation.ts` | Declares features like `budgeting`, `budget-allocation` — **navigation/feature flags**, not execution. |
| **Premium gating (automation)** | `lib/financial-automation/premium.ts` | `hasAdvancedAutomationAccess`; default 50/30/20; free tier one active rule; custom allocation JSON requires Pro+. |

---

## 2. Existing transaction categorization logic

| Component | Location | Behavior |
|-----------|----------|----------|
| **Direction** | `inferDirection(amount)` | Sign-based → `INFLOW` / `OUTFLOW`. |
| **Kind (enum)** | `inferCategoryKind(direction, description)` | `TRANSFER` (keyword list), otherwise inflow → `INCOME`, outflow → `EXPENSE`. **Bug/tech debt:** inflow branch maps both payroll-like and generic inflows to `INCOME` (second branch unreachable). |
| **Plaid enrichment** | `lib/bank/sync-runner.ts` | Stores Plaid payload in `metadata`; sets `subcategory` from `personal_finance_category.detailed`. **Not** mapped to a single internal category taxonomy (Housing/Food/…). |
| **Manual API** | `POST /api/automation/transactions` | Optional `categoryName`; resolves/creates `TransactionCategory` with chosen `kind`. |
| **`FinancialEventType.TRANSACTION_CATEGORIZED`** | Prisma enum | **Not emitted** in searched application code — categorization steps are invisible to the event timeline unless folded into updates. |

**Gaps vs target taxonomy:** Housing, Food, Fuel, Tools, Business, Savings, Taxes, Entertainment, Utilities, Healthcare, Other — **not** enforced as enums; today mostly free-text `categoryName` / Plaid PF category string.

---

## 3. Existing budgeting logic

| Surface | Reality |
|---------|---------|
| **`BudgetAllocation` model** | Fields: `amount`, `spent`, `category`, `period`, `notifications`. |
| **`GET/POST /api/guardrails`** | **Reuses `BudgetAllocation` rows** and maps them to UI type `SpendingGuardrail` (`lib/types/financial-wellness`). **`spent`/`current` are user-supplied at create** — **not automatically rolled up from transactions** in this path. |
| **`useSpendingGuardrails`** | Calls `/api/guardrails` — **disconnected from** automation `SpendingGuardrailPolicy`. |
| **`SpendingGuardrailPolicy`** | Real spend aggregation in automation: `financialTransaction` `OUTFLOW` sums over period vs `limitAmount`. |
| **Allocation rules** | `executeRule` for `ALLOCATION` **computes** `{ bucket, allocatedAmount }[]` in `resultSnapshot` only — **no write** to `SmartBucket`, `SmartAllocation`, or `BudgetAllocation`. |

**Conclusion:** “Budget” is **split across three concepts** (BudgetAllocation UI guardrails, SpendingGuardrailPolicy automation, allocation JSON buckets `needs`/`wants`/`savings`) without a single rolling “bucket balance” source of truth tied to transactions.

---

## 4. Existing allocation systems

| System | Persistence | Trigger | Notes |
|--------|-------------|---------|------|
| **AutomationRule type ALLOCATION** | `actions` JSON array `{ bucket, percent }` | Every `evaluateAutomationForTransaction` for **all** posted transactions (inflow and outflow unless filtered later — **no condition evaluation in engine today**) | Premium custom % vs `getDefaultAllocationActions()` (50/30/20). **40/30/30** not present in code reviewed. |
| **SmartBucket / SmartAllocation** | Prisma | Manual API | No automatic increment from rules engine. |
| **SavingsRule / SavingsExecution** | Prisma + `createDatabaseService` | Smart-saving API | Parallel track; not invoked from `sync-runner` / expense / automation transaction POST in the same path as `evaluateAutomationForTransaction`. |

---

## 5. Existing automation infrastructure

- **Entry points:** `evaluateAutomationForTransaction` from:
  - `lib/bank/sync-runner.ts` (per Plaid tx)
  - `app/api/automation/transactions/route.ts`
  - `app/api/expenses/route.ts` (create/update)
  - `app/api/webhooks/stripe/route.ts` (invoice-related financial transaction path when present)
- **Rule query:** `triggerType: 'TRANSACTION_POSTED'` **only** — rules with `PAYCHECK_DETECTED`, `SCHEDULED`, `BILL_DUE`, `BALANCE_THRESHOLD` are **not** evaluated by this function.
- **Conditions:** `rule.conditions` JSON exists on model — **not interpreted** in `executeRule` for allocation/guardrail branches reviewed.
- **Executions:** `AutomationExecution` records success/fail/skip (e.g. premium skip).

---

## 6. Existing notification systems

| Channel | Location | Linked to budget workflow? |
|---------|----------|----------------------------|
| **`AutomationNotification` + prisma** | `createAutomationNotification` in rules-engine | Yes for guardrail breach/warning (overspending). Stored; `GET /api/automation/notifications`. |
| **`Notification` model + `/api/notifications`** | Separate generic user notifications | Not wired to automation engine in audited paths. |
| **`NotificationService`** | `lib/services/notification-service.ts` | Email on **manual** guardrail create via `/api/guardrails` threshold math; **in-app intentionally skipped** (comment: no table — but `AutomationNotification` exists separately). |

**Gap:** Multiple notification stores and no unified **action payload** schema (deep link to transaction, mutations) for operational UX.

---

## 7. Existing recurring transaction / bill logic

- **`FinancialTransaction.isRecurringCandidate`** — heuristic: duplicate description count in recent rows.
- **`FinancialEventType.RECURRING_TRANSACTION_DETECTED`** — emitted from bank sync when flag set.
- **`RecurringBill` model** + API surfaces exist in schema/admin paths — **not** chained into `evaluateAutomationForTransaction` in reviewed sync code.
- **Subscription spike / increase** — enum `AutomationNotificationType.SUBSCRIPTION_INCREASE` exists; **no production detector** located in audited sync/categorization code.

---

## 8. Existing premium feature gating

- **`hasAdvancedAutomationAccess`:** PRO, LIFETIME, ZEN_PLUS.
- **`POST /api/automation/rules`:** Free tier max **one** enabled rule; custom allocation JSON ≠ default → `premiumRequired` + 403 if not entitled.
- **Runtime skip:** Premium-required rules logged as execution `SKIPPED` with `PREMIUM_REQUIRED` if enabled in DB inconsistently.

---

## 9. Duplication risks (high severity)

1. **`/api/transactions` vs `/api/automation/transactions` vs `/api/bank/transactions`** — three different meanings (card ledger vs canonical `FinancialTransaction` vs Plaid-filtered list). Naming and product docs must distinguish to avoid duplicate “transaction” UX.
2. **`BudgetAllocation` + `/api/guardrails` vs `SpendingGuardrailPolicy` + `/api/automation/guardrails`** — two guardrail backends; automation spend math uses **only** policy model.
3. **`AutomationRule` vs `SavingsRule`** — two rule systems (Prisma-first vs database service abstraction).
4. **Allocation targets:** JSON bucket names (`needs`/`wants`/`savings`) vs `SmartBucket.name` vs `BudgetAllocation.category` — no FK or mapping layer.

---

## 10. Missing operational workflow gaps (vs goal)

| Required capability | Status |
|---------------------|--------|
| Synced bank transactions → categorization → rules → **persisted bucket updates** | Sync + rules run; **bucket persistence missing** for allocations. |
| Income detection (paycheck / gig / contractor) | **Partial:** keyword heuristics + `UserIncomeProfile` exists; **no** `PAYCHECK_DETECTED` trigger execution; no structured income classification on `FinancialTransaction`. |
| User correction / splits / business-personal | **Partial:** category override on manual API; **no** split lines model; **no** first-class business/personal tag on transaction. |
| Guardrails: subscription drift, bill timing, low balance | Enums exist; **detectors + scheduled triggers** not wired in reviewed code. |
| Actionable notifications | Notifications are **informational strings**; **no** standard action metadata contract for review/adjust/snooze. |
| Single financial truth for “budget impact” | **No** automatic update of `BudgetAllocation.spent` or `SmartBucket.currentAmount` from `FinancialTransaction` rollups in automation path. |

---

## 11. Recommended source-of-truth flow (conceptual)

1. **Ingestion:** All money movement that should affect budgeting **creates or updates** `FinancialTransaction` (already true for Plaid sync, automation manual, expense mirror; verify other inflows).
2. **Classification layer:** Normalize to internal **category slug** + **transaction class** (income subtype, expense, transfer, subscription…) on the row (and/or child split table if added) — emit **`TRANSACTION_CATEGORIZED`** when classification changes.
3. **Rules:** Evaluate **after** classification; support `conditions` JSON in code; add **trigger dispatch** for `PAYCHECK_DETECTED` etc. based on classification, not raw description only.
4. **Allocations:** Persist results as **`SmartAllocation` lines** (+ bump `SmartBucket.currentAmount`) **or** a single consolidated “allocation ledger” model — avoid leaving results only in `AutomationExecution.resultSnapshot`.
5. **Guardrails:** **One** policy model powering both UI and engine, or a **bidirectional sync** between `BudgetAllocation` and `SpendingGuardrailPolicy` until merge is feasible.
6. **Events:** Every material step emits `FinancialEvent` (already partly true — extend missing types usage).
7. **Notifications:** Prefer **`AutomationNotification`** (or unify with `Notification`) with **structured `metadata.actions`** for client routing.

---

## 12. Safe implementation strategy (post-audit)

1. **Do not add a third rule engine.** Extend `lib/financial-automation/rules-engine.ts` + `AutomationRule` or explicitly deprecate `SavingsRule` with a migration plan.
2. **Do not add parallel transaction tables.** Route all budgeting inputs through `FinancialTransaction` + explicit links (`expenseId`, `invoiceId`, etc.).
3. **Introduce persisted allocation writes** before building new dashboards — otherwise automation remains observability-only.
4. **Consolidate guardrails** behind one API or automate sync — avoid users configuring limits that automation never reads.
5. **Phase triggers:** Implement `PAYCHECK_DETECTED` evaluation **after** income classification exists; avoid keyword-only coupling long-term.

---

## Files explicitly reviewed (representative)

- `prisma/schema.prisma` — `FinancialTransaction`, `TransactionCategory`, `AutomationRule`, `AutomationExecution`, `SpendingGuardrailPolicy`, `BudgetAllocation`, `SmartBucket`, `SmartAllocation`, `RecurringBill`, `FinancialEvent*`, enums.
- `lib/bank/sync-runner.ts`, `lib/bank/plaid.ts`
- `lib/financial-automation/transactions.ts`, `rules-engine.ts`, `premium.ts`
- `lib/financial-events/events.ts`
- `app/api/automation/transactions/route.ts`, `app/api/automation/rules/route.ts`, `app/api/automation/guardrails/route.ts`, `app/api/automation/notifications/route.ts`
- `app/api/bank/sync/route.ts`, `app/api/bank/transactions/route.ts`
- `app/api/expenses/route.ts` (transaction bridge + automation)
- `app/api/transactions/route.ts` (CardTransaction — different domain)
- `app/api/guardrails/route.ts`, `lib/hooks/useSpendingGuardrails.ts`
- `app/api/smart-saving/buckets/route.ts`, `app/api/smart-saving/rules/route.ts`
- `lib/income-profiles/activation.ts`
- `lib/services/notification-service.ts`

---

_Phase 1 complete: implementation intentionally deferred._
