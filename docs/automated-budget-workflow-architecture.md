# Automated Budget Workflow — Architecture (Phase 2)

Operational design for a **single end-to-end money automation pipeline** that reuses Prisma models, **`FinancialTransaction`** as the ledger, **`FinancialEvent`** as the append-only observability/action stream, and the existing **`lib/financial-automation/rules-engine.ts`** spine. No code in this document; it is implementation guidance for Phase 3+.

---

## Target flow (canonical)

```
Connect Bank
    → Sync Transactions (existing Plaid pipeline)
        → Persist FinancialTransaction (+ dedupe / links)
            → Income & type detection (classification)
                → Persist category + subtype on transaction (+ optional splits)
                    → Evaluate automation (rules + conditions + triggers)
                        → Persist allocation ledger (bucket updates / SmartAllocation)
                            → Evaluate guardrails (single policy layer)
                                → Emit FinancialEvents (step-granular)
                                    → Raise AutomationNotification (+ structured actions)
                                        → Client: transaction review / adjust / goal / snooze
```

Anything that skips **`FinancialTransaction`** for “budget impact” breaks the invariant.

---

## 1. Transaction lifecycle

### 1.1 States (conceptual)

| State | Meaning | Existing hooks |
|-------|---------|----------------|
| **Ingested** | Row upserted from Plaid/import/manual/expense mirror | Sync runner, automation transactions, expense API |
| **Classified** | Direction + domain category + subtype (paycheck vs gig…) | Extend beyond `inferCategoryKind` keyword list |
| **Rule-evaluated** | `AutomationExecution` rows | `evaluateAutomationForTransaction` |
| **Allocated** | Money assigned to envelopes / tax / savings buckets | **To implement:** persist beyond `resultSnapshot` |
| **Guardrailed** | Warning/breach emitted if thresholds exceeded | `GUARDRAIL` automation + policy model |
| **User-reviewed** | User confirmed or corrected | **To implement:** action completion tracking (metadata or small table) |

### 1.2 Classification contract (target)

**Transaction class (operational):** `INCOME`, `EXPENSE`, `TRANSFER`, `SUBSCRIPTION`, `PAYCHECK`, `CONTRACTOR_PAYMENT`, `GIG_PAYMENT` — map to **stable string enum** in code (Prisma enum extension or `metadata.classification` until schema migration).

**Display categories (user-facing):** Housing, Food, Fuel, Tools, Business, Savings, Taxes, Entertainment, Utilities, Healthcare, Other — map via **`TransactionCategory`** or seeded slug table so Plaid PF categories converge.

**Supporting flags:** business vs personal (`metadata` → future column); split transactions (parent `FinancialTransaction.id` + child rows or normalized `SplitLine` later).

### 1.3 User correction strategy

1. PATCH (or POST replace) resolves category + subtype; emits **`TRANSACTION_CATEGORIZED`** (reuse existing enum — currently unused).
2. Re-run **only** downstream steps: guardrails dependent on categories, allocations that predicate on **`PAYCHECK`**, etc.

### 1.4 Plaid enrichment

Retain raw Plaid object in **`metadata`**; add **deterministic mapping layer** PF → slug (configurable overrides per user in premium later).

---

## 2. Allocation execution flow

### 2.1 When income arrives (primary case)

Trigger options (layered):

1. **Immediate:** After classification, if `class ∈ { PAYCHECK, GIG_PAYMENT, … }`, enqueue **high-priority evaluation** (`PAYCHECK_DETECTED` semantics even if internally still keyed off classification + trigger column).
2. **Batch:** Scheduled job for overdue reconciliations (future).

Execution:

1. Load active `AutomationRule` rows ordered by **`priority`**; interpret **`conditions` JSON** (amount band, merchant pattern, classification).
2. For `ALLOCATION`: compute amounts from **`actions`** percentages.
3. **Persist:** Insert **`SmartAllocation`** rows with `source: 'AUTOMATION'` and increment **`SmartBucket.currentAmount`** atomically **or** use a ledger table + rollup (choose one writes path to avoid drift).

Preset handling:

- **Free:** preset only — **`getDefaultAllocationActions()`** (50/30/20) already defined in `premium.ts`.
- **Premium:** persisted custom JSON in **`AutomationRule.actions`**, validated with Zod (already partly present on rules CRUD).

**40/30/30:** add as preset constant alongside 50/30/20 if product requires parity; gate custom beyond presets by premium tier.

Contractor tax / emergency fund: model as **named buckets** in `SmartBucket` + allocation action targets keyed by **`bucketSlug`** resolving to bucket id — avoid magic strings drifting from DB.

---

## 3. Categorization strategy

1. **Default:** heuristic + PF mapping (deterministic).
2. **Merchant memory:** optional user override table keyed by normalized merchant descriptor (later).
3. **Never** silently invent categories outside allowed slugs — default to **Other** with reason in metadata.

---

## 4. Recurring detection strategy

1. **Short term:** Continue `isRecurringCandidate` + **`RECURRING_TRANSACTION_DETECTED`** event from sync.
2. **Bill timing:** Correlate **`RecurringBill`** due dates + expected amount window with **`FinancialTransaction`** for `BILL_TIMING_ALERT` automation notifications (new execution branch or dedicated rule type).
3. **Subscription drift:** Diff current charge vs trailing median for same merchant id / normalized name; emit **`SUBSCRIPTION_INCREASE`** notification with prior amount in metadata.

---

## 5. FinancialEvent integration strategy

Emit events for:

- **`TRANSACTION_CREATED`** — already emitted on ingest paths.
- **`TRANSACTION_CATEGORIZED`** — on any classification change from user or system.
- **`AUTOMATION_RULE_EXECUTED` / FAILED** — already present.
- **New buckets (recommended):** `ALLOCATION_EXECUTED`, `GUARDRAIL_WARNING`, `GUARDRAIL_BREACH` — reconcile with existing enums (some GUARDRAIL types may already exist; extend Prisma migration only after audit of enum usages).

Correlation: **`relatedEntityType: TRANSACTION`**, `relatedEntityId: financialTransactionId`, plus JSON metadata for allocations and thresholds.

---

## 6. Notification / action architecture

### 6.1 Storage

Prefer **`AutomationNotification`** for automation-derived alerts unless product decides to unify with **`Notification`**. Avoid a third queue.

### 6.2 Action schema (recommended `metadata`)

```json
{
  "actions": [
    { "type": "REVIEW_TRANSACTION", "financialTransactionId": "…" },
    { "type": "ADJUST_CATEGORY", "financialTransactionId": "…", "allowedCategorySlugs": ["…"] },
    { "type": "EDIT_ALLOCATION_RULE", "automationRuleId": "…" },
    { "type": "SNOOZE", "notificationId": "…", "until": "ISO8601" },
    { "type": "MARK_EXPECTED", "financialTransactionId": "…" },
    { "type": "CREATE_GOAL", "template": "emergency-fund" },
    { "type": "IGNORE_MERCHANT_PATTERN", "pattern": "…" }
  ]
}
```

Client routes actions to dedicated review surfaces — **no passive badges-only widgets**.

Email path: optionally reuse **`NotificationService`** but must share the same **`AutomationNotification` id for idempotency.

---

## 7. Premium gating strategy

| Capability | Tier |
|-----------|------|
| Default allocation presets (50/30/20, optional 40/30/30) | Free |
| Limited active automation rules | Free (enforce count — already partly enforced on rules POST) |
| Custom percentages / multi-rule flows / advanced triggers | Premium |
| Advanced guardrails (subscription drift, balance projections) | Premium |
| Merchant rules & split handling | Premium (optional product decision) |

Server enforcement: **`hasAdvancedAutomationAccess`** + execution-time skip + **403 on illegal mutations** matching existing rules route pattern.

---

## 8. Anti-duplication strategy

1. **Single ledger:** `FinancialTransaction`; deprecate budgeting use of **`CardTransaction`** except card-specific UX that never rolls into envelopes.
2. **Single allocation writer:** Extend automation engine; **`SavingsRule`** either wraps same engine or is frozen with migration banner.
3. **Single guardrail source:** Migrate **`BudgetAllocation`**-based thresholds to **`SpendingGuardrailPolicy`** **or** implement sync cron between them until one deletion is safe.
4. **Single notification creation path** for alerts: **`createAutomationNotification`** + schema actions.

---

## 9. Scalability assessment

- Per-transaction **`evaluateAutomationForTransaction`** — acceptable for MVP sync volumes; optimize with bulk evaluation + single DB transaction per sync batch once volume grows.
- Guardrail aggregation queries already scope by **`userId`** and date range — add composite indexes `(userId, postedAt)` if absent after EXPLAIN analysis.
- Event table growth — TTL/archival jobs are a later ops concern.

---

## 10. Real-world UX flow

1. User completes bank OAuth (existing onboarding).
2. Post-sync checklist: **N uncategorized transactions** → review queue.
3. After review, paycheck row triggers **allocation review** toast with **Approve / Edit presets** for free users; premium sees **Customize split**.
4. Guardrail breaches appear in **`/api/automation/notifications`**-backed inbox with **deep links** to PATCH transaction / edit rule modals.

---

_Phase 2 design ready for phased implementation._
