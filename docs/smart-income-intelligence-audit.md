# Smart Income Intelligence — Phase 1 audit

This audit inventories existing StackZen systems that touch **income**, **recurrence**, **cash flow**, **guidance**, **operational alerts**, and **explainability**, and flags duplication risks before the income intelligence layer was added.

## 1. Existing income systems

| Area | Location | Role |
|------|----------|------|
| Canonical ledger | `FinancialTransaction` (`prisma/schema.prisma`) | All inflows/outflows; direction `INFLOW` / `OUTFLOW`. |
| Transfer exclusion | `lib/financial-automation/transactions.ts` (`isTransferDescription`) | Keeps internal transfers out of operational patterns. |
| Operational classification | `lib/financial-automation/classification.ts` | `PAYCHECK`, `GIG_PAYMENT`, `CONTRACTOR_PAYMENT`, metadata parsing for automation. |
| Income detection notifications | `lib/financial-automation/rules-engine.ts` (`maybeNotifyIncomeDetected`) | One-off in-app signals when operational class matches (not a full stability engine). |
| Income profiles API | `app/api/income-profiles/**` | Profile activation for adaptive UX (not a duplicate ledger analyzer). |

## 2. Existing recurring income systems

| Area | Location | Role |
|------|----------|------|
| Recurrence engine | `lib/cashflow/recurrence.ts` | `detectRecurringPatterns` groups INFLOW/OUTFLOW by normalized label, median interval, MAD-based stability, cadence inference, `nextExpectedDate`. |
| Cash flow forecast | `lib/cashflow/forecast.ts` | Loads same transaction window as constants; injects `detected_income` events from recurring income series. |
| Constants | `lib/cashflow/constants.ts` | `TRANSACTION_LOOKBACK_DAYS`, `MAX_TRANSACTION_ROWS`. |
| Types | `lib/cashflow/types.ts` | `DetectedSeriesDto`, risk codes, explain payload shapes. |

**New shared export:** `buildRecurringSeriesKey` exposes the grouping key used for recurrence and for income concentration so analysis stays aligned with Cash Flow.

## 3. Existing operational guidance systems

| Area | Location | Role |
|------|----------|------|
| Guidance engine | `lib/guidance/engine.ts` | Recommendations from goals + forecast-shaped inputs. |
| Guidance attention | `lib/guidance/ensure-guidance-notifications.ts` | Idempotent `AutomationNotification` rows keyed by `guidance_*`. |
| Cashflow attention | `lib/cashflow/ensure-cashflow-attention.ts` | Upserts `cashflow_<riskCode>` from `buildCashFlowForecast` risks. |

Income intelligence **reuses** `buildCashFlowForecast` for `forecastRiskCodes` and reserve nudges — it does not invent parallel “guidance scores.”

## 4. Existing volatility-related logic

| Area | Location | Role |
|------|----------|------|
| Interval stability | `lib/cashflow/recurrence.ts` | MAD vs median interval → `stability` → blended `confidence`. |
| Forecast risk | `lib/cashflow/risk.ts` | Projected low balance, bill clusters, invoice gaps, etc. |
| Forecast explain | `lib/cashflow/explain.ts` | Assumptions and input counts for forecast responses. |

There was **no** dedicated “income volatility dashboard” prior to this work; volatility was implicit inside recurrence + forecast risks only.

## 5. Existing connectivity dependencies

| Area | Location | Role |
|------|----------|------|
| Connectivity snapshot | `lib/bank/connectivity-snapshot.ts` | Per-connection staleness, recent Plaid inflow stats. |
| Bank attention | `lib/bank/ensure-connectivity-attention.ts` | `bank_operational_health_<connectionId>` notifications. |
| Bank sync | `app/api/bank/sync/route.ts` (updated) | Previously first ACTIVE connection only; now optional `connectionId` for explicit per-connection sync. |

Stale sync reduces trust in **timing** of deposits; income intelligence reads ledger rows produced after sync — it does not replace connectivity monitoring.

## 6. Existing trust / explainability systems

| Area | Location | Role |
|------|----------|------|
| Operational alert DTO | `lib/operational-notifications/enrich.ts` | `trust` block from metadata; `inferDomain` routes UI domains. |
| Explainability builder | `lib/explainability/build-operational-explainability.ts` | Structured explain payloads for alert cards. |
| FinancialEvent | `lib/financial-events/events.ts` | Audit trail; `createAutomationNotification` emits `AUTOMATION_NOTIFICATION_CREATED`. |

Income intelligence notifications carry `metadata.trust` and `incomeIntelligence` evidence (series keys, sample transaction ids) compatible with the same pipeline.

## 7. Duplication risks (mitigated)

| Risk | Mitigation |
|------|------------|
| Second recurrence detector | Reuse `detectRecurringPatterns` only. |
| Second “income score” | None introduced; thresholds are documented ratios (HHI, shares, recurrence confidence, calendar delay). |
| Second forecast | Snapshot calls `buildCashFlowForecast` once per snapshot; `GET` income-intelligence passes cached snapshot into `ensure` to avoid double work on that route. Alerts pipeline still invokes forecast separately for cashflow ensure (acceptable; documented in completion report as future batch optimization). |
| Disconnected analytics page | Workspace panel + API only; links into Money Control / Cash Flow workflows. |

## 8. Missing income intelligence workflows (before implementation)

- No consolidated **delayed expected deposit** view tied to `nextExpectedDate`.
- No **concentration** view on raw inflows by the same grouping key as recurrence.
- No **declining payout** heuristic on consecutive inflow medians.
- No **reserve nudges** explicitly tying concentration + irregularity + forecast risk codes in one explainable payload.

## 9. Recommended operational architecture

1. **Single snapshot builder** (`buildIncomeIntelligenceSnapshot`) composes: ledger query + `detectRecurringPatterns` + `computeInflowConcentration` + delayed/irregular/declining builders + `buildCashFlowForecast` for risk codes + deterministic reserve nudges.
2. **Single ensure pipeline** (`ensureIncomeIntelligenceAttentionNotifications`) maps snapshot slices to fixed `attentionKind` values (`income_intel_*`), updating or auto-resolving like bank connectivity.
3. **Workspace** surfaces the same snapshot for transparency; alerts queue stays authoritative for “what needs action now.”

## 10. Safe implementation strategy

- Ship **read-only analysis** first in API + panel; wire **alerts** only after thresholds are conservative (warnings for delayed/concentration/declining; irregular at INFO).
- Keep all thresholds in code with comments — no opaque ML.
- Prefer **marking notifications read** when conditions clear inside `ensure` (same pattern as `ensureBankConnectivityAttentionNotifications`).
- **Ownership:** all queries scoped by `session.user.id` / `userId` on server routes.

---

### Files reviewed (non-exhaustive)

`prisma/schema.prisma`, `lib/cashflow/**`, `lib/guidance/**`, `lib/bank/**`, `lib/financial-automation/{classification,transactions,rules-engine}.ts`, `lib/operational-notifications/**`, `app/api/operational-center/alerts/route.ts`, `app/api/bank/sync/route.ts`, `components/operational-workspace/UnifiedOperationalWorkspace/index.tsx`.
