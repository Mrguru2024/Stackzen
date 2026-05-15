# Financial Automation Architecture

## Objective

Define a production-ready financial automation architecture for StackZen that:

- reuses existing Prisma + NextAuth + FinancialEvent foundations
- supports manual + synced financial workflows for hybrid earners
- avoids duplicate transaction, budgeting, and event systems
- enforces ownership, security, and premium gating at API boundaries

---

## Architectural Principles

1. **Prisma is canonical ORM and schema authority.**
2. **NextAuth session ownership is mandatory for all financial mutations and reads.**
3. **FinancialEvent is the centralized activity/event stream.**
4. **One canonical transaction model across manual + bank-synced inputs.**
5. **One rule execution pipeline for allocations, guardrails, and notifications.**
6. **Premium controls are backend-enforced, not UI-only.**
7. **Idempotency is required for webhooks, sync jobs, and automation actions.**

---

## 1) Schema Recommendations (Prisma)

Use existing models where possible and extend minimally.

### A. Bank connection and account models

- `BankConnection`
  - `id`, `userId`, `provider` (`PLAID`), `status`, `itemId`, `institutionId`, `institutionName`
  - `accessTokenEncrypted`, `accessTokenLast4`, `syncCursor`, `lastSuccessfulSyncAt`, `lastSyncErrorAt`, `syncErrorCode`
  - `createdAt`, `updatedAt`, `disconnectedAt`

- `BankAccount`
  - `id`, `userId`, `bankConnectionId`, `providerAccountId`
  - `name`, `officialName`, `mask`, `type`, `subtype`
  - `currentBalance`, `availableBalance`, `currency`
  - `isActive`, `createdAt`, `updatedAt`

### B. Canonical transaction model

- `Transaction`
  - `id`, `userId`, `bankAccountId?`, `source` (`MANUAL`, `PLAID_SYNC`, `INVOICE_PAYMENT`, `IMPORT`)
  - `externalId?` (provider transaction id), `dedupeHash`
  - `postedAt`, `authorizedAt?`, `amount`, `direction` (`INFLOW`, `OUTFLOW`)
  - `description`, `merchantName?`, `counterparty?`
  - `categoryId?`, `subcategory?`, `isTransfer`, `isRecurringCandidate`
  - `jobId?`, `invoiceId?`, `expenseId?`
  - `metadata` (JSON), `createdAt`, `updatedAt`

- `TransactionCategory`
  - `id`, `userId`, `name`, `type` (`INCOME`, `EXPENSE`, `TRANSFER`), `isSystem`, `isPremiumOnly`

### C. Rules engine models

- `AutomationRule`
  - `id`, `userId`, `name`, `type` (`ALLOCATION`, `GUARDRAIL`, `NOTIFICATION`, `RECURRING_TRANSFER`)
  - `triggerType` (`TRANSACTION_POSTED`, `PAYCHECK_DETECTED`, `SCHEDULED`, `BILL_DUE`, `BALANCE_THRESHOLD`)
  - `conditions` (JSON), `actions` (JSON), `schedule` (JSON)
  - `priority`, `enabled`, `premiumRequired`, `createdAt`, `updatedAt`

- `AutomationExecution`
  - `id`, `userId`, `ruleId`, `triggerRef`, `status`, `attempt`
  - `startedAt`, `completedAt?`, `errorCode?`, `errorMessage?`
  - `inputSnapshot` (JSON), `resultSnapshot` (JSON)

### D. Guardrails and bill automation models

- `SpendingGuardrail`
  - `id`, `userId`, `categoryId?`, `cycle` (`WEEKLY`, `MONTHLY`)
  - `limitAmount`, `warnAtPercent`, `softBlockEnabled`, `aiCoachModeEnabled`, `enabled`

- `RecurringBill`
  - `id`, `userId`, `name`, `amount`, `categoryId?`, `nextDueDate`, `frequency`
  - `autopayEnabled`, `reminderDaysBefore`, `enabled`, `lastTriggeredAt?`

### E. Notification models

- `AutomationNotification`
  - `id`, `userId`, `type`, `channel` (`IN_APP`, future `EMAIL`, `PUSH`)
  - `title`, `body`, `severity`, `readAt?`, `relatedEntityType?`, `relatedEntityId?`, `createdAt`

### F. Security fields

- Token and secret fields must be encrypted at rest.
- Keep raw tokens out of logs/events/metadata.
- Store only masked account identifiers for UI display.

---

## 2) Plaid Architecture

### Link + token exchange flow

1. Client requests link token: authenticated call to `/api/plaid/link-token`.
2. User completes Plaid Link.
3. Client sends `public_token` to `/api/plaid/exchange-token`.
4. Server exchanges for access token, fetches institution + accounts, persists encrypted connection/account records.
5. Emit `FinancialEvent` (`BANK_CONNECTED`).

### Sync jobs

- Background sync (scheduled + manual trigger):
  - use cursor-based incremental sync
  - dedupe by provider transaction id + hash fallback
  - map provider categories to StackZen categories
  - upsert transactions, never blind insert
  - emit `TRANSACTION_SYNC_COMPLETED`/`TRANSACTION_SYNC_FAILED` events

### Webhook processing

- Endpoint `/api/plaid/webhook`:
  - verify source and payload signature/validation
  - enqueue sync task per connection
  - idempotency key from webhook event id
  - retry with exponential backoff and dead-letter on repeated failures

### Ownership and account validation

- Ensure linked accounts belong to authenticated user through connection ownership.
- Never allow cross-user account lookup by external identifiers.

---

## 3) Transaction Lifecycle

1. **Ingestion**
   - Manual entry, Plaid sync, import, or payment/webhook origin.
2. **Normalization**
   - Convert to canonical `Transaction` shape, set direction/source, compute `dedupeHash`.
3. **Categorization**
   - Rule-based category assignment (merchant + keyword + amount + history).
4. **Linking**
   - Link to `Job`, `Invoice`, or `Expense` when deterministic match exists.
5. **Recurring detection**
   - Mark recurring candidates by cadence and descriptor similarity.
6. **Automation evaluation**
   - Trigger allocation/guardrail/notification rule checks.
7. **Event emission**
   - Emit FinancialEvents for transaction posted, re-categorized, recurring detected, and rule actions.

---

## 4) Rules Engine Design

### Rule structure

- **Trigger:** what starts evaluation (`TRANSACTION_POSTED`, `SCHEDULED`, etc.).
- **Condition:** boolean filters (category, amount thresholds, source, cycle state, account).
- **Action:** allocation move, guardrail alert, bill reminder, savings milestone, webhook task.
- **Schedule:** optional cron-like config for periodic checks.
- **Control:** `enabled`, ownership, premium gating, priority.

### Execution flow

1. Trigger received (event or schedule).
2. Load active rules for user + trigger type.
3. Evaluate conditions deterministically.
4. Execute actions in transaction-safe sequence.
5. Record `AutomationExecution`.
6. Emit FinancialEvent for each action outcome.
7. Queue notification if action requires user awareness.

### Example production rules

- Default free allocation on income inflow.
- Premium custom split allocation by income type.
- Contractor tax allocation rule on external inflows.
- Subscription spike alert when recurring bill amount increases.
- Spending cap warning at category threshold.

---

## 5) Guardrails System

### Capabilities

- Spending caps per category or all discretionary spending.
- Warning thresholds (for example 70%, 90%, 100%).
- Soft-block warnings (advisory, no account lockout).
- AI coach mode flag for future recommendation generation.
- Weekly/monthly cycle support.

### Engine behavior

- Guardrails evaluated on every new outflow transaction and periodic cycle checks.
- Guardrail breaches create:
  - `AutomationExecution` record
  - `FinancialEvent` (`GUARDRAIL_WARNING`, `GUARDRAIL_BREACH`)
  - `AutomationNotification` for user.

---

## 6) Notification Automation Architecture

### Trigger types supported

- Overspending alerts
- Paycheck/income detected
- Subscription increase alerts
- Low balance warnings
- Bill due reminders
- Savings milestone events

### Delivery strategy

- Start with in-app notifications persisted in DB.
- Add channel fan-out later (`EMAIL`, `PUSH`) without changing trigger core.
- Keep notification generation idempotent by `(userId, type, relatedEntity, cycleWindow)`.

### Integration with FinancialEvent

- Notification creation always references the originating event/action.
- Timeline and notification center remain consistent views over same operational reality.

---

## 7) Premium Gating Strategy

### Free tier

- Default allocation presets only (e.g. standard percentage rules).
- Limited number of active automation rules.
- Basic guardrails and categories.

### Premium tier

- Custom percentage allocations.
- Multiple active automation rules across triggers.
- Advanced guardrails and advanced category controls.
- Advanced recurring automations and alerts.

### Enforcement points

- API layer: hard deny unauthorized premium actions.
- Rule creation/update endpoints: validate tier before persist.
- Execution layer: skip premium-only rule execution when entitlement no longer valid.

---

## 8) Automation Execution Flow (End-to-End)

1. Event enters system (Plaid sync, manual transaction, invoice payment, recurring scheduler).
2. Canonical transaction/domain write succeeds.
3. FinancialEvent emitted.
4. Rules engine executes eligible rules.
5. Actions create allocations/guardrail statuses/reminders.
6. FinancialEvents emitted for each automation outcome.
7. Notifications generated and persisted.
8. UI surfaces update via existing timeline/notifications endpoints.

This preserves one source of truth while supporting future automation expansion.

---

## 9) Recurring Sync Strategy

- Detect recurring candidates by:
  - normalized descriptor similarity
  - amount tolerance windows
  - cadence confidence score
- Promote candidate to confirmed recurring bill after confidence threshold.
- On each sync cycle:
  - reconcile expected due vs posted transaction
  - trigger bill due reminder if due window starts without observed payment
  - trigger subscription increase alert if amount jumps above variance threshold

---

## 10) FinancialEvent Integration Strategy

All key transitions must emit FinancialEvents:

- Bank connected/disconnected
- Sync started/completed/failed
- Transaction posted/updated/re-categorized
- Recurring detected
- Rule executed/failed
- Guardrail warning/breach
- Notification generated

Event metadata should carry stable references (`transactionId`, `ruleId`, `connectionId`) but never secrets.

---

## 11) Anti-Duplication Strategy

1. Deprecate and remove duplicate `route-cached.ts` financial paths after migration window.
2. Consolidate auth usage to one guard helper and one auth options source.
3. Consolidate tier logic to one policy module.
4. Consolidate category logic into canonical DB-backed service (remove mock hook ambiguity).
5. Ensure all dashboard financial widgets consume canonical APIs, not local mock sources.
6. Keep one activity stream (`FinancialEvent`) and one transaction model.

---

## 12) Scalability Assessment

### Near-term (MVP foundation)

- Works for single-user and moderate multi-tenant load with Prisma + indexed transaction tables.
- Cursor-based sync + idempotent writes controls reprocessing cost.

### Mid-term

- Add queue-backed workers for Plaid sync and automation execution.
- Add partitioning/indexing strategy on `Transaction.postedAt`, `userId`, and `source`.

### Long-term

- Introduce async event bus abstraction for high-throughput automation while keeping FinancialEvent as persisted audit trail.
- Add analytics materialization tables for heavy dashboards to avoid hot-querying raw transaction rows.

---

## 13) Security Considerations

- Encrypt provider access tokens and sensitive connection credentials at rest.
- Strict ownership filters on every account/transaction/rule query.
- Idempotency keys for webhook and sync events.
- Defensive logging (no tokens, no full account numbers).
- Zod validation on all automation and bank endpoints.
- Rate limits on link-token, exchange-token, webhook, and manual sync endpoints.

---

## 14) Fraud/Abuse Considerations

- Detect suspicious link/unlink churn and repeated exchange failures.
- Protect against replayed webhooks via event id dedupe.
- Guard against automation loops:
  - max execution depth per trigger
  - rule cooldown windows
  - duplicate notification suppression
- Detect impossible transaction patterns (excess duplicates in short windows, negative/positive reversal anomalies).

---

## 15) MVP Foundation Delivery Boundaries

Production MVP foundation should include:

- Plaid secure token exchange + encrypted persistence
- Institution/account persistence
- Canonical transaction model and sync ingestion
- Base categorization and recurring-candidate detection
- Allocation rule engine MVP with premium custom percentages
- Guardrails calculation engine
- Notification trigger infrastructure
- FinancialEvent emission for all critical automation paths

This architecture intentionally excludes visual-only additions and disconnected demo logic.
