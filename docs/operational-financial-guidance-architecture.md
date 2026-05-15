# Operational Financial Guidance — Architecture

**Purpose:** Deterministic decision support that composes **existing** forecast, goal, allocation, invoice, job, and guardrail signals into prioritized, actionable recommendations. **Not** a chatbot.

---

## Principles

1. **Traceability** — Each item lists concrete inputs (risk codes, row counts, thresholds) and calculation steps as strings.  
2. **No duplicate engines** — Reuse `buildCashFlowForecast`, `analyzeOperationalGoal`, Prisma reads only.  
3. **Single attention queue** — Persist as `AutomationNotification` with `attentionKind: guidance_*`.  
4. **User control** — Reuse read / snooze / dismiss; extend PATCH with optional `guidanceApplied`.

---

## Guidance kinds (logical taxonomy)

| Kind | Typical sources |
|------|------------------|
| `ALLOCATION_ADJUSTMENT` | `ALLOCATION_PRESSURE`, goal vs. drag conflict (synthesized) |
| `GOAL_PACING` | Multiple active goals behind pace (aggregate, not per-goal duplicate) |
| `CASH_FLOW_SAFETY` | `PROJECTED_LOW_BALANCE` |
| `BILL_TIMING` | `BILLS_BEFORE_NEXT_INCOME`, `BILL_CLUSTER` |
| `CONTRACTOR_RESERVE` | `DEPOSIT_RUNWAY_WARNING` |
| `SPENDING_REDUCTION` | Low projected balance + enabled guardrails present |
| `INVOICE_FOLLOWUP` | `INVOICE_RECEIVABLE_GAP`, overdue / due-soon unpaid invoices |
| `EMERGENCY_RESERVE` | No active `EMERGENCY_FUND` goal + weak projected cushion |

---

## Pipeline

```
buildCashFlowForecast(includeDetails: true)
        ↓
analyzeRisks-derived risks (already on forecast)
        ↓
load active OperationalGoals + analyzeOperationalGoal (same forecast)
        ↓
load unpaid invoices (overdue + due in 7d), enabled guardrails
        ↓
map + synthesize → GuidanceRecommendation[]
        ↓
ensureGuidanceAttentionNotifications → upsert AutomationNotification rows
        ↓
FinancialEvent GUIDANCE_ENGINE_SYNCED (batch metadata)
```

---

## Metadata shape (per notification)

```json
{
  "version": 1,
  "actions": [...],
  "attentionKind": "guidance_CASH_FLOW_SAFETY_PROJECTED_LOW_BALANCE",
  "trust": { "why": "...", "recommendedNextStep": "...", "sourceEventType": "GUIDANCE_ENGINE_SYNCED" },
  "guidance": {
    "kind": "CASH_FLOW_SAFETY",
    "priority": "high",
    "riskCode": "PROJECTED_LOW_BALANCE",
    "inputsUsed": { ... },
    "calculations": [ "..." ],
    "expectedImpact": "...",
    "confidence": 0.75
  },
  "guidanceEngineVersion": 1
}
```

---

## Prioritization

Map `RiskFindingDto.severity` and synthesized rules to **`critical` | `high` | `medium` | `low`** → `NotificationSeverity` (CRITICAL / WARNING / INFO).

---

## Operational UI domain

- New `OperationalUiDomain`: **`guidance`**.  
- `inferDomain`: `attentionKind.startsWith('guidance_')`.

---

## Actions

- `OPEN_CASH_FLOW`  
- `OPEN_MONEY_CONTROL` (tab: `review` | `rules` | `buckets`)  
- `OPEN_OPERATIONAL_GOAL` (emergency create path)  
- `OPEN_INVOICE`  
- `OPEN_JOB`  
- `SNOOZE` (existing)

---

## Out of scope (v1)

- LLM-generated copy  
- Auto-changing rules/buckets without user confirmation  
- Auto-dismiss of stale guidance (optional follow-up)

---

*End of architecture document.*
