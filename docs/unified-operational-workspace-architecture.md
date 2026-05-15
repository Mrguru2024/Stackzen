# Unified Operational Workspace — Architecture

**Purpose:** One **operational orchestration** surface at `/operational-center` that ranks and dedupes attention, adapts shortcuts to income profile, and reuses existing APIs and card components — **not** a second dashboard.

---

## Principles

1. **Reuse queues** — Still `AutomationNotification` + existing ensure pipeline.  
2. **No duplicate orchestration DB** — Priority logic is **read-time** over existing DTOs.  
3. **Actionable only** — Shortcuts are deep links into Money Control, Cash Flow, Goals, Timeline, Invoices/Jobs.  
4. **Explainability** — Existing `trust` blocks; workspace adds **workflow strip** (review → correct → resolve).  
5. **Noise reduction** — Dedupe by `dedupeKey` when two rows represent the same forecast risk (cashflow + guidance).

---

## Data flow

```
GET /api/income-profiles/activation  → profiles[]
GET /api/operational-center/alerts?ensure=true  → alerts[]

dedupeOperationalAlerts(alerts)
rankOperationalAlerts(deduped, { profiles })

Render:
  - Adaptive shortcut row (profile-driven)
  - Workflow continuity strip (static copy + links)
  - OperationalAlertCards(items = ranked)
```

---

## `dedupeKey` rules (server-side in `enrich.ts`)

| Source | Key |
|--------|-----|
| Guidance with `metadata.guidance.riskCode` | `risk:{CODE}` |
| Cashflow with `attentionKind` `cashflow_*` | `risk:{SNAKE_UPPER}` (e.g. `cashflow_projected_low_balance` → `risk:PROJECTED_LOW_BALANCE`) |
| Else if `relatedEntityType` + `relatedEntityId` | `entity:{type}:{id}` |
| Else | `null` (no dedupe) |

**Winner selection** (same key): higher `NotificationSeverity` first; tie-break prefer **`guidance`** domain over **`financial`** for richer structured metadata.

---

## Adaptive shortcuts (client)

| Profile signal | Boost in rank | Extra shortcuts |
|----------------|---------------|-----------------|
| CONTRACTOR / FREELANCE / BUSINESS | +invoice, +work domain scores | Invoices, Jobs, Quotes (if in nav) |
| PAYCHECK / SIDE_HUSTLE | +financial, +goals | Savings, Expenses (existing nav) |
| GIG | +work, +expenses | Gigs, Expenses |

Shortcuts are **only** links to existing routes (no new pages).

---

## UI composition

- **`UnifiedOperationalWorkspace`** (client): loads activation + alerts, runs engine, renders sections.  
- **`OperationalAlertCards`**: unchanged API; receives **ranked** list.  
- **Embedded mode**: optional `embedded` prop to hide page-level header when reused (future).

---

## Navigation

- **Same** `featureKey`: `operational-center`.  
- **Title**: “Operations hub” (product naming) — reduces confusion with generic “center.”  
- **Activation**: ensure all profiles include money-operation keys so sidebar does not hide the hub.

---

## Out of scope (v1)

- Replacing Dashboard or merging Timeline into this page.  
- AI-generated prioritization.  
- Writing new notification types (reuse ensure chain).

---

*End of architecture document.*
