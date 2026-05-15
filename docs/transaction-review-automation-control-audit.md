# Transaction Review & Automation Control — Phase 1 Audit

Audit of StackZen surfaces relevant to a **production-grade transaction review + automation control** UX. Implementation notes are factual as of repository review; placeholders and gaps are called out explicitly.

---

## 1. Existing reusable systems

| System | Location | Fit for operational UX |
|--------|----------|-------------------------|
| **Canonical ledger** | `FinancialTransaction`, `POST/GET/PATCH app/api/automation/transactions*` | PATCH supports category / operational class / business–personal correction; ingest merges `stackzen*` metadata. |
| **Allocation persistence** | `SmartAllocation.financialTransactionId`, `AUTOMATION_RULE:{ruleId}` source, `lib/financial-automation/allocation-persistence.ts`, `SmartBucket` type `AUTOMATION_ENVELOPE` | Enables “where money moved” for automated splits. |
| **Rules engine** | `lib/financial-automation/rules-engine.ts`, `AutomationRule`, `AutomationExecution` | Executes on transaction lifecycle; executions store `inputSnapshot` / `resultSnapshot` JSON. |
| **Guardrails / policies** | `SpendingGuardrailPolicy`, `GET/POST/PATCH/DEL .../api/automation/guardrails` | Separate from legacy `BudgetAllocation` guardrails (`/api/guardrails`). |
| **Automation notifications** | `AutomationNotification`, `GET .../api/automation/notifications` | `metadata.actions` structured for client routing (prior work). Generic `notification` table + `/components/notifications` is a **different path**. |
| **Financial timeline API** | `GET /api/financial-events/timeline` + `lib/financial-events/query.ts` | Supports `types=` and cursor; can surface `TRANSACTION_*`, `AUTOMATION_*`, `GUARDRAIL_*` events when filtered. |
| **Premium automation** | `lib/financial-automation/premium.ts`, enforced on `POST /api/automation/rules` | Single active rule free tier; custom allocation requires Pro+. |
| **Bank / manual ingest** | `lib/bank/sync-runner.ts`, expenses mirror, Stripe invoice tx | All feed ledger + automation evaluation. |

---

## 2. Existing transaction review flows

- **`PATCH /api/automation/transactions/[id]`** — Real correction path: resolves/creates `TransactionCategory`, merges operational metadata, emits `TRANSACTION_CATEGORIZED`, re-runs `evaluateAutomationForTransaction`.
- **No first-class operational UI** was found consuming this API (`grep` for `financialTransaction` / `/api/automation` in `.tsx`: **none** aside from unrelated paths).
- **`components/transactions/index.tsx`** — **Server component** merges **`Income`** + **`Expense`** only; filter `<select>` is **UI-only, no wiring** comment in spirit; **not** the ledger. **Disconnected** from automation and `FinancialTransaction`.
- **`CardTransactions`** — **mock data** (`components/cards/card-transactions.tsx`); informational only relative to budgeting automation.

---

## 3. Automation visibility gaps

- **`GET /api/automation/rules`** — Exists; **`PATCH`/`DELETE` on `[id]`** were **missing** at audit time (plan: add `[id]` for pause, priority, safe edits).
- **`AutomationExecution`** — Queryable via Prisma; **no dedicated GET API** for “execution history” in `app/api/automation/` at audit start.
- **“Test rule safely”** — No dry-run endpoint; explainability relies on snapshots + replay after corrections only.
- **Settings `SmartSavingControls`** — Wired to **`/api/smart-saving/rules`** (`SavingsRule`-style abstraction), **parallel surface** to `AutomationRule`; risk of **two mental models** (“smart saving types” vs “automation rules”).

---

## 4. Notification action support

- **`AutomationNotification.metadata`** supports action array (`buildAutomationActionMetadata` in `lib/financial-automation/actionable-metadata.ts`).
- **`GET .../api/automation/notifications`** — List only; **no PATCH** at audit start for dismiss/snooze/read.
- **`components/notifications/index.tsx`** — Reads **`prisma.notification`** with **no `userId` filter** (incorrect for multi-user production); purely passive list; **not** automation notifications.

---

## 5. Bucket visibility systems

- **`GET /api/smart-saving/buckets`** — Uses `getServerSession` + email lookup; returns `SmartBucket` + last 10 `SmartAllocation`s; **not** aligned with `requireAuthSession` pattern used by automation APIs.
- **No combined “bucket + source transaction + source rule”** API at audit time; linkage exists in DB (`SmartAllocation.financialTransactionId`, allocation `source` string).

---

## 6. Premium gating

- **Rules POST**: free tier one enabled rule; allocation presets vs custom JSON; `premiumRequired` flag on rules.
- **UI** should mirror: disable custom % editor and multi-rule affordances for FREE; no separate “automation premium” API beyond subscription level on `User`.

---

## 7. Duplication risks

| Risk | Detail |
|------|--------|
| **Two transaction UIs** | Income/expense table vs `FinancialTransaction` ledger. |
| **Two notification stores** | `Notification` vs `AutomationNotification`. |
| **Two rule paradigms** | `AutomationRule` vs `SavingsRule` / smart-saving toggles. |
| **Two guardrail backends** | `SpendingGuardrailPolicy` (automation) vs `BudgetAllocation` (`/api/guardrails`). |

---

## 8. Missing fintech trust UX gaps

- No **in-app** review queue for uncategorized / high-impact transactions.
- No **visible link** from notification → transaction → rule → allocation lines.
- **Financial timeline** client (`FinancialTimelineView`) filter sets omit **transaction/automation** event groups by default.
- **Split transactions**, **inline “why this category”** (beyond metadata), and **rule simulation** are not implemented.
- **Loading/error/empty** states absent on any dedicated automation review surface (no surface existed).

---

## 9. Recommended operational UX flow

1. **Single hub** (e.g. `/money-control`) with tabs: **Review** (ledger), **Rules**, **Alerts** (`AutomationNotification`), **Buckets**, **Activity** (timeline filtered to money automation types).
2. **Row actions** on ledger: open detail → PATCH corrections + show linked `SmartAllocation` rows + last matching `AutomationExecution` entries.
3. **Rule row**: toggle enabled, edit priority (Pro: full actions), link to execution list filtered by `ruleId`.
4. **Alert row**: primary actions from `metadata.actions` (navigate with query `?transactionId=` / `?ruleId=`), PATCH read/snooze.
5. **Trust copy**: static explainers + live data from `resultSnapshot` / event metadata (no fake AI).

---

## 10. Safe implementation strategy

1. **Do not** extend `Income`/`Expense` table UI as the source of truth for bank automation; **drive review from `FinancialTransaction`** + existing APIs.
2. **Add** thin APIs only: `GET/PATCH` rule by id, `GET` executions, `GET` transaction by id with allocations, `PATCH` automation notification, **auth-aligned** `GET` buckets for automation buckets.
3. **Reuse** `requireAuthSession`, Zod, existing PATCH transaction route behavior.
4. **Consolidate UI** in one route to avoid “disconnected pages”; link out to Financial Timeline with query params for power users.
5. **Defer** split lines schema, dry-run engine, and full merge of `BudgetAllocation` vs `SpendingGuardrailPolicy` to later phases.

---

## Files explicitly reviewed (representative)

- `prisma/schema.prisma` — `FinancialTransaction`, `SmartBucket`, `SmartAllocation`, `AutomationRule`, `AutomationExecution`, `AutomationNotification`, `FinancialEvent`.
- `app/api/automation/**/*.ts`, `app/api/automation/transactions/[id]/route.ts`
- `lib/financial-automation/*`, `lib/financial-events/query.ts`, `app/api/financial-events/timeline/route.ts`
- `components/transactions/index.tsx`, `components/cards/card-transactions.tsx`, `components/notifications/index.tsx`, `components/financial-events/FinancialTimelineView.tsx`
- `app/(dashboard)/settings/page.tsx` (Smart Saving Controls)
- `app/api/smart-saving/buckets/route.ts`, `app/api/smart-saving/rules/route.ts`
- `config/nav-links.ts`

---

_Phase 1 complete._
