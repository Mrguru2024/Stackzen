# Smart Income Intelligence — architecture

Deterministic, ledger-backed **operational income intelligence** for StackZen. No synthetic “income scores,” no arbitrary 0–100 confidence for users — only explainable statistics and the same recurrence confidence already used in Cash Flow.

## Data sources (canonical)

1. **`FinancialTransaction`** — same query window as forecast: `postedAt >= now - TRANSACTION_LOOKBACK_DAYS`, `take: MAX_TRANSACTION_ROWS`.
2. **`detectRecurringPatterns`** — `lib/cashflow/recurrence.ts` for `recurringIncome` series (`DetectedSeriesDto`).
3. **`buildCashFlowForecast(userId, { includeDetails: false })`** — for `forecast.risks` codes only (reserve nudge linkage).
4. **Grouping key** — `buildRecurringSeriesKey(direction, tx)` so concentration buckets align with recurrence.

## Capabilities

### 1. Income stability analysis

- **Deposit consistency / payout intervals / cadence:** from `DetectedSeriesDto` (`cadence`, `medianIntervalDays`, `occurrences`, `confidence`).
- **Amount variance:** `amountCoefficientOfVariation` per series (optional explain line in `confidenceNotes`).
- **Seasonal behavior:** not a separate black-box model; monthly/quarterly cadence comes from recurrence median interval bands.

### 2. Delayed income detection

- For each recurring income series with `nextExpectedDate`, compare `startOfDay(nextExpected)` to `startOfDay(now)`.
- If expected day is **before** today → `DelayedIncomeSignalDto` with `daysPastExpected` (calendar days).
- Explain: same cadence roll-forward as Cash Flow.

### 3. Income source health

- **Largest sources & concentration:** `computeInflowConcentration` over 90d non-transfer INFLOW; HHI = Σ share²; top sources with sample transaction ids.
- **Volatility trends:** low recurrence `confidence` flags `IrregularPayoutSeriesDto` (threshold constants in `snapshot.ts`).
- **Deposit recovery:** operational action is “refresh sync + review ledger,” not a simulated recovery score.

### 4. Reserve planning intelligence

`ReserveGuidanceNudgeDto` objects with fixed `code` enum:

- `FORECAST_PRESSURE` — if forecast risk codes include balance/runway/bills-before-income class codes.
- `CONCENTRATION_BUFFER` — HHI ≥ 0.48 or top share ≥ 58%.
- `DELAYED_DEPOSIT_BUFFER` — any delayed series.
- `IRREGULAR_PAYOUT_BUFFER` — any irregular series.

Each nudge lists **reasoning** strings and **evidenceTransactionIds** (subset of real ids).

### 5. Operational alerts

`ensureIncomeIntelligenceAttentionNotifications` upserts:

| `attentionKind` | Severity | Condition |
|-----------------|----------|-----------|
| `income_intel_delayed` | WARNING | ≥1 delayed series |
| `income_intel_concentration` | WARNING | HHI ≥ 0.48 or top share ≥ 58% |
| `income_intel_irregular` | INFO | ≥1 irregular series |
| `income_intel_declining` | WARNING | ≥1 declining median pattern |

When conditions clear, existing rows are **marked read** with `autoResolvedReason` (mirrors bank connectivity ensure).

### 6. Explainability

- Snapshot `explain.assumptions`, `inputsUsed`, `confidenceNotes` (deterministic strings).
- Notification `metadata.trust` (`why`, `whatChanged`, `recommendedNextStep`, `sourceEventType` string for UI).
- `metadata.incomeIntelligence` holds structured evidence (delayed series, concentration DTO, irregular/declining slices).

## API

- **`GET /api/operational-center/income-intelligence`**  
  - Query `ensure` (default `true`): runs ensure with the same snapshot instance (no double snapshot on this route).  
  - Response: `IncomeIntelligenceSnapshotDto`.

## UI

- **`SmartIncomeIntelligencePanel`** in Operations hub — operational copy, links to Money Control (`txnId`) and Cash Flow.

## Multi-bank sync (related operational gap)

- **`POST /api/bank/sync`** accepts optional JSON `{ "connectionId": "<id>" }` for an ACTIVE connection owned by the user; omit body for legacy “first ACTIVE connection” behavior.
- **`ConnectedFinancialOperationsPanel`** exposes per-row “Sync this connection.”

## Future AI enrichment (safe hook)

- Snapshot is a plain JSON DTO; a future model may **annotate** reasoning lines only if each claim cites transaction ids and deterministic metrics already in the payload.
