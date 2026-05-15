# Connected Financial Operations — Phase 1 Audit

## 1. Existing bank connectivity systems

| Component | Role |
|-----------|------|
| **`BankConnection`** | Per-Plaid `itemId`; `status` (`ACTIVE`, `REQUIRES_REAUTH`, `DISCONNECTED`, `ERROR`); `lastSuccessfulSyncAt`, `lastSyncErrorAt`, `syncErrorCode`, `syncCursor`, encrypted access token. |
| **`BankAccount`** | Linked accounts per connection; `FinancialTransaction.bankAccountId` ties ledger rows to connectivity. |
| **`BankSyncJob`** | Queue: `PENDING` → `PROCESSING` → `SUCCEEDED` / `FAILED` with backoff in `process-sync-jobs`. |
| **`lib/bank/plaid.ts`** | Plaid API integration (tokens, transactions). |
| **`lib/bank/sync-runner.ts`** | `runBankSyncForConnection`: Plaid fetch, **dedupe** via `userId_dedupeHash` upsert, category inference, automation evaluation, updates `syncCursor` + **`lastSuccessfulSyncAt`**, clears sync error fields, emits **`BANK_SYNC_COMPLETED`** and per-row **`TRANSACTION_CREATED`**. |
| **`POST /api/bank/sync`** | User-triggered sync; on failure updates connection `lastSyncErrorAt` / `syncErrorCode`, emits **`BANK_SYNC_FAILED`**. |
| **`POST /api/bank/exchange-token`** | Link completion; upserts `BankConnection`, accounts, **`BANK_CONNECTED`** event. |
| **`POST /api/plaid/webhook`** | Queues `BankSyncJob` + **`BANK_SYNC_COMPLETED`** metadata note “job queued” (actual sync in worker). |
| **`POST /api/bank/process-sync-jobs`** | Worker-style processor with retries. |

## 2. Existing sync workflows

- Manual: `POST /api/bank/sync` → `runBankSyncForConnection`.
- Async: webhook → `BankSyncJob` → `process-sync-jobs` → `runBankSyncForConnection`.
- **Ingestion reliability**: `buildTransactionDedupeHash` + `upsert` on `userId_dedupeHash` prevents duplicate ledger rows.

## 3. Existing trust / reliability UX

- **Money Control** copy references bank sync and empty ledger states.
- **FinancialEvent** trail: `BANK_CONNECTED`, `BANK_SYNC_COMPLETED`, `BANK_SYNC_FAILED`, `TRANSACTION_CREATED`.
- **Operational workspace** activation checklist treats “bank linked” as `BankConnection` **ACTIVE** count (see adaptive onboarding).

## 4. Stale-data risks

- **`lastSuccessfulSyncAt` null** after long-lived `ACTIVE` connection → forecast/cashflow use **balances** that may drift from Plaid.
- **Stale sync** (no success for many days) while still `ACTIVE` → user may not notice until forecast confidence drops.
- **`REQUIRES_REAUTH` / `ERROR`** without prominent operational surfacing beyond raw status in DB.

## 5. Operational sync gaps

- No **single API** summarizing per-connection freshness, latest job outcome, and recent ingestion for Operations hub.
- No **idempotent operational attention** rows keyed to `BANK_CONNECTION` for reconnect / stale / post-error states (invoice overdue pattern exists; bank parity was missing).
- **“Connected income intelligence”** (recent inflow signal from `PLAID_SYNC` **INFLOW**) not summarized for trust UX.

## 6. Duplication risks

- A second “sync dashboard” model would duplicate `BankConnection` + `BankSyncJob`.
- Fake simulated balances or mock sync success paths would violate production rules.

## 7. Missing connectivity workflows (before this build)

- Deterministic **connectivity snapshot** for UI.
- **Ensure** pipeline step for **bank operational health** notifications aligned with `AutomationNotification` + `FinancialEvent` patterns.
- **Domain routing** for bank health cards in operational UI (`inferDomain`).

## 8. Recommended operational connectivity architecture

1. **`buildConnectivitySnapshot(userId)`** — read-only Prisma aggregation: connections, accounts, latest job, max `postedAt` for linked transactions, recent **INFLOW** Plaid counts (14d) per connection.
2. **`ensureBankConnectivityAttentionNotifications(userId)`** — idempotent upsert per connection `attentionKind = bank_operational_health_{connectionId}`; **mark read** when state returns healthy (no duplicate FIN spam on updates).
3. **`GET /api/operational-center/connectivity`** — exposes snapshot for workspace panel.
4. Wire **ensure** into existing **`/api/operational-center/alerts`** pipeline (same session/ownership as other ensures).

## 9. Safe implementation strategy

- No Plaid simulation; all numbers from Prisma + existing sync runner side effects only.
- **Create** path uses `createAutomationNotification` (existing `AUTOMATION_NOTIFICATION_CREATED` audit); **update** path uses `prisma.automationNotification.update` only.
- Extend **`inferDomain`** for `bank_operational_health_*` attention kinds to `financial`.

### Files reviewed (representative)

- `prisma/schema.prisma` — `BankConnection`, `BankAccount`, `BankSyncJob`, `FinancialTransaction`, `FinancialEvent`
- `lib/bank/sync-runner.ts`, `lib/bank/plaid.ts` (as referenced by sync)
- `app/api/bank/sync/route.ts`, `exchange-token/route.ts`, `process-sync-jobs/route.ts`, `app/api/plaid/webhook/route.ts`
- `app/api/operational-center/alerts/route.ts`
- `lib/operational-notifications/enrich.ts`
- `components/operational-workspace/UnifiedOperationalWorkspace/index.tsx`, `components/money-control/index.tsx`
