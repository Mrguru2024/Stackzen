# Connected Financial Operations — Architecture

## Principles

1. **Canonical state** remains `BankConnection`, `BankAccount`, `BankSyncJob`, `FinancialTransaction`, `FinancialEvent`.
2. **No simulated Plaid** — all metrics are derived from persisted rows and timestamps.
3. **Operational attention** uses the same `AutomationNotification` + `metadata.attentionKind` idempotency pattern as cashflow/guidance.
4. **Updates ≠ new audit spam** — notification **creates** use `createAutomationNotification` (FinancialEvent); **updates** use Prisma `update` only.

## Snapshot API

### `GET /api/operational-center/connectivity`

Returns `ConnectivitySnapshotDto`:

- `connections[]`: per-connection institution, status, `lastSuccessfulSyncAt`, error fields, **hours since last success**, **staleness label** (`fresh` | `stale` | `never_synced` | `reconnect_required` | `post_error`), latest `BankSyncJob` summary, active account count, **max `postedAt`** among ledger rows for accounts on that connection, **recentPlaidInflowCount14d** + **recentPlaidInflowSum14d** (deterministic deposit signal).
- `generatedAt` ISO timestamp.

## Attention ensure

### `attentionKind`

`bank_operational_health_{connectionId}` — unique per connection.

### Classification (priority order)

1. **`reconnect_required`** — `status !== ACTIVE` (user must re-link / fix item).
2. **`post_error`** — `ACTIVE` and `lastSyncErrorAt` is after `lastSuccessfulSyncAt` (or success missing while error present).
3. **`never_synced`** — `ACTIVE`, no `lastSuccessfulSyncAt`, connection age **>** `NEVER_SYNCED_MIN_AGE_HOURS`.
4. **`sync_stale`** — `ACTIVE`, success older than **`STALE_SYNC_HOURS`** (default 72h).
5. **`healthy`** — otherwise; existing unread row is **marked read** with `autoResolvedReason: bank_connectivity_recovered`.

### Actions & trust

- Actions: `[{ type: 'OPEN_MONEY_CONTROL', tab: 'review' }, { type: 'OPEN_CASH_FLOW' }]`.
- Trust block explains **which Prisma fields** drove the classification (deterministic copy).

## UI

`ConnectedFinancialOperationsPanel` (Operations hub):

- Renders snapshot rows + short “forecast uses bank balances” hint when stale.
- **Does not** duplicate sync execution — links to Money Control / user-triggered sync route as already implemented.

## `inferDomain`

`attentionKind` prefix `bank_operational_health` → **`financial`** domain so cards group with money operations.

## Constants

- `STALE_SYNC_HOURS` = 72  
- `NEVER_SYNCED_MIN_AGE_HOURS` = 36  

Tune via single module export; no env required for MVP.
