# Predictive Cash Flow & Bill Intelligence — Phase 1 Audit

**Application:** StackZen Next.js 15 App Router · **ORM:** Prisma → Supabase Postgres (no direct Supabase SQL for financial logic).

This audit inventories reusable systems, duplication risks, and gaps before implementing deterministic cash-flow forecasting.

---

## 1. Existing reusable systems

| System | Location / model | Role for cash flow |
|--------|------------------|---------------------|
| **Canonical ledger** | `FinancialTransaction` | History for recurrence detection, direction/amount, `postedAt`, `metadata` operational classification, `isRecurringCandidate`. |
| **Bank ingest** | `lib/bank/sync-runner.ts` | Plaid sync → upsert ledger rows → `TRANSACTION_CREATED` / `RECURRING_TRANSACTION_DETECTED` events → `evaluateAutomationForTransaction`. |
| **Manual / API ledger** | `app/api/automation/transactions` POST | Same recurrence heuristic + categorization path as sync. |
| **Recurring heuristic** | `detectRecurringCandidate` in `lib/financial-automation/transactions.ts` | Duplicate **same description** ≥2 in last 20 rows → flag + event (weak signal only). |
| **User-defined bills** | `RecurringBill` | `nextDueDate`, `frequency` (string), `amount`, `enabled` — strong obligation source when populated. |
| **Balances** | `BankAccount.currentBalance`, `availableBalance` | Starting point for projection (sum active accounts). |
| **Automation** | `AutomationRule`, `AutomationExecution` | Allocation/guardrail timing; execution snapshots can justify allocation pressure heuristics. |
| **Buckets** | `SmartBucket`, `SmartAllocation` | Posted envelope movements tied to transactions/rules — explains allocation impact, not a second ledger. |
| **Guardrails** | `SpendingGuardrailPolicy` | Cycle caps vs spend from ledger — overlaps **risk** narrative with projected balance (different lens). |
| **Operational queue** | `AutomationNotification` + `metadata.actions` / `attentionKind` | Single attention surface (Operational Center, Money Control tab). |
| **Financial events** | `FinancialEvent` + `FinancialEventType` enum | Central narrative; currently **no** cash-flow-specific types (extend via migration). |
| **Jobs / invoices** | `Job`, `Invoice`, APIs under `app/api/invoices`, `app/api/jobs` | Timing signals: due dates, deposit/job status — already drive **`ensureOperationalAttentionNotifications`**. |
| **Low balance (live)** | `rules-engine.ts` `LOW_BALANCE_THRESHOLD_USD` | Instantaneous linked-account balance warning — **not** forward-looking. |
| **Operational ensure** | `lib/operational-notifications/ensure-attention.ts` | Idempotent invoice/job alerts — pattern to extend for forecast-derived risks. |

---

## 2. Existing recurring / bill systems

| Mechanism | Notes |
|-----------|--------|
| **`RecurringBill`** | Explicit user/automation bill schedule — **authoritative** when enabled. |
| **`detectRecurringCandidate`** | Description repetition only — **no cadence**, **no amount variance**, **no next-date** math. |
| **`RECURRING_TRANSACTION_DETECTED`** | Event emitted from sync when flag set — audit trail only unless downstream consumes it. |
| **`AutomationNotificationType.BILL_DUE_REMINDER`** | Enum exists; production wiring depends on scheduled automation paths (verify cron/schedulers separately). |
| **`SUBSCRIPTION_INCREASE`** | Enum exists; automated drift detector **not** fully wired in audited sync code (per prior budget workflow docs). |

**Gap:** No unified **obligation object** merging DB bills + statistically detected subscriptions—forecast layer should compute that merge deterministically per request (no new table required for MVP).

---

## 3. Existing balance / projection systems

| Area | Finding |
|------|---------|
| **Aggregate dashboard** | `components/dashboard/index.tsx` aggregates `Income` / `Expense` Prisma models **without `userId` filter** in server component — legacy bug unrelated to forecast; cash-flow API **must** scope by session `userId`. |
| **Dedicated forecast engine** | **None found** — no `lib/cashflow/*`, no `/api/cashflow/*` prior to this initiative. |
| **Charts** | Product rule: **no fake/static forecast charts** — any visualization must bind to computed API output. |

---

## 4. Existing invoice / job timing signals

| Signal | Source |
|--------|--------|
| Invoice due / overdue / due-soon | `Invoice.dueDate`, `status`; **`ensureOperationalAttentionNotifications`** creates **`invoice_overdue`**, **`invoice_due_soon`**. |
| Deposit / balance owed | `Job.status` `DEPOSIT_PENDING`, `AWAITING_PAYMENT`; alerts **`job_deposit_required`**, **`job_awaiting_payment`**. |
| Stripe | Payment verification updates invoice/job status — cash-flow should treat **pending** invoices as **expected inflows** on **dueDate** only as an explicit **assumption** (documented). |

---

## 5. Existing allocation timing signals

| Signal | Source |
|--------|--------|
| Rule execution order | `AutomationRule.priority`, `AutomationExecution` timestamps. |
| Persisted allocations | `SmartAllocation.source`, amounts per transaction. |
| Guardrail evaluation | On outflows + periodic evaluation in rules engine — related to **spend** vs **cash runway**. |

**Gap:** No first-class “allocation calendar.” MVP derives **allocation pressure** from recent automation allocation totals vs projected cushion (deterministic formula in architecture doc).

---

## 6. Existing notification / action systems

| Piece | Role |
|-------|------|
| **`buildOperationalAttentionMetadata`** | `attentionKind`, `trust`, `actions[]`. |
| **`AutomationClientAction`** | Transaction review, invoice/job/client open, rules tab, buckets, etc. |
| **`PATCH /api/automation/notifications/[id]`** | Read / snooze / dismiss — unchanged for cash-flow alerts. |

**Extension:** Add **`OPEN_CASH_FLOW`** (or similarly named) action routing to **`/cash-flow`** so Operational Center stays single-queue.

---

## 7. Duplication risks

1. **Second forecast table or duplicate ledger** — forbidden; all projections derive from **`FinancialTransaction`** + **`RecurringBill`** + **`Invoice`** + **`BankAccount`**.  
2. **Parallel bill reminder systems** — avoid duplicating `RecurringBill` UX with a separate “bills app”; reuse Operational Center + Cash Flow view.  
3. **`BudgetAllocation` vs `SpendingGuardrailPolicy`** — already noted duplicate guardrail concepts elsewhere; cash-flow **must not** invent a third cap system—reference guardrails only as explain context if needed.  
4. **Duplicate invoice/job alerts** — cash-flow risk alerts should use distinct **`attentionKind`** prefixes (`cashflow_*`) and avoid double-copying the same invoice narrative where **`invoice_*`** already exists (prefer complementary copy or skip redundant titles).

---

## 8. Production UX gaps (pre-MVP)

1. No single screen answering **“Will I have enough in 7 / 14 / 30 days?”**  
2. Recurring detection too weak for projections without statistical pass over ledger history.  
3. Forward-looking **low balance** vs instantaneous low balance not differentiated for users.  
4. No explainability bundle (inputs, assumptions, trace IDs) on one payload.

---

## 9. Recommended source-of-truth architecture

| Layer | Source of truth |
|-------|-----------------|
| Historical cash movements | **`FinancialTransaction`** |
| User-scheduled obligations | **`RecurringBill`** |
| Linked cash snapshot | **`BankAccount`** balances |
| Expected customer payments | **`Invoice`** (explicit assumptions documented in API) |
| Work blocking cash | **`Job`** status + linked invoices |
| Attention items | **`AutomationNotification`** only |
| Audit / narrative | **`FinancialEvent`** (append-only; new enum values behind migration) |

---

## 10. Safe implementation strategy

1. **Library-first:** Pure deterministic modules (`recurrence`, `forecast`, `risk`, `explain`) with **no** UI side effects.  
2. **Single API:** `GET /api/cashflow/forecast` — Zod query params, **`requireAuthSession`**, all Prisma queries **`userId`**.  
3. **Operational integration:** Extend **`ensureOperationalAttentionNotifications`** (or sibling **`ensureCashflowAttentionNotifications`**) with **idempotent** `attentionKind` keys; reuse **`createAutomationNotification`**.  
4. **FinancialEvent:** Add **`CASHFLOW_FORECAST_GENERATED`** / **`CASHFLOW_RISK_DETECTED`** via Prisma migration; emit **sparingly** (e.g., when persisting new risk alerts or optional opt-in flag) to avoid event spam on every poll.  
5. **UI:** One **`/cash-flow`** dashboard route — numeric summary + lists + links; **no placeholder charts**.  
6. **Validation:** `prisma validate`, `generate`, `typecheck`, targeted `jest` for `lib/cashflow`.

---

## Files explicitly consulted for this audit

`prisma/schema.prisma`, `lib/bank/sync-runner.ts`, `lib/financial-automation/transactions.ts`, `lib/financial-automation/rules-engine.ts`, `lib/operational-notifications/ensure-attention.ts`, `lib/financial-automation/actionable-metadata.ts`, `app/api/operational-center/alerts/route.ts`, `docs/automated-budget-workflow-audit.md`, `components/dashboard/index.tsx`, codebase search for cashflow/forecast/recurring patterns.

---

**STOP:** Audit complete. Proceed to architecture (`docs/cashflow-bill-intelligence-architecture.md`) and phased implementation.
