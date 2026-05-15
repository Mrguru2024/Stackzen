# External Financial Execution & Operational Integrations — Architecture

**Date:** 2026-05-13  
**Depends on:** `docs/external-financial-execution-audit.md`, `docs/unified-operational-command-center-architecture.md`  
**Principles:** Deterministic; approval-based execution only; no autonomous payments; no hidden integrations; session ownership unchanged.

---

## 1. Purpose

Bridge **operational coordination** (alerts, command center, panels) and **real-world financial execution** (Money Control, cash flow, invoices, timing calendar, bank sync) by preserving a **small, whitelisted execution handoff** in the URL and surfacing a **deterministic continuity banner** on destination pages.

This layer **does not** execute money movement. It **explains and anchors** user-initiated work.

---

## 2. Execution handoff contract (URL)

### Query parameters (whitelist)

| Key | Values | Required |
|-----|--------|----------|
| `op_src` | `command_center` (v1); reserved: `operational_alert`, `timing_panel`, `reserve_panel`, `contractor_panel`, `workflow_panel`, `bank_panel` | Yes when any `op_*` is used |
| `op_sub` | `reserve` \| `timing` \| `contractor` \| `workflow` | No |
| `op_band` | `escalating` \| `coordination` \| `stabilizing` | No |
| `op_step` | `1`–`6` (command center CTA ladder step) | No |

**Rules**

- Unknown values → **ignored** on parse; banner may not render.
- **Merge** with existing query strings and **preserve hash** (`#operational-actions`).
- **Max length:** reject or truncate query string > 512 chars (defensive).

### Serialization ownership

- **`lib/operational-execution-context`** — `serializeHandoff`, `appendHandoffToHref`, `parseHandoff`, `explainHandoffBanner` (pure functions + deterministic copy tables).

---

## 3. Operational execution continuity

| Origin | v1 behavior |
|--------|-------------|
| **Command center** | `continuation.executionHandoff` populated from CTA ladder; primary CTA + subsystem links call `appendHandoffToHref` |
| **Alerts** | Follow-up: append `op_src=operational_alert` + domain metadata where `resolveActionHref` is stable |
| **Timing / reserve / contractor / workflow panels** | Follow-up: footer links use same helper with `op_src=*_panel` |
| **Bank panel** | Follow-up: “Open cash flow” / sync CTA may pass `op_src=bank_panel` |

---

## 4. Execution context preservation

Preserved **only** in the URL (no new Prisma tables):

- **Originating source** — `op_src`
- **Subsystem focus** — `op_sub`
- **Band at navigation time** — `op_band` (informational; user may change state before acting)
- **Ladder step** — `op_step` ties primary CTA to documented priority order

**Not preserved in v1:** full snapshot JSON, notification IDs, or PII (avoid leaking into analytics/referrer logs beyond same-origin navigation).

---

## 5. Operational handoffs (coordination map)

| From (operational) | To (execution surface) | Execution type |
|--------------------|-------------------------|----------------|
| Reserve escalation / guidance | Money Control · rules | User edits allocation automation |
| Timing escalation / shift proposal | Timing calendar | User proposes bill shift → operational action |
| Contractor escalation | Invoices list / detail | User follows up receivables / payment flows |
| Pending operational actions | Hub `#operational-actions` | Preview / apply / dismiss |
| Attention queue | Hub `#operational-attention` | Triage notifications |
| Default / forecast | Cash flow | Confirm timing and balances |
| Bank staleness | Sync API + cash flow | User triggers sync; refreshes ledger inputs |

---

## 6. Execution explainability (banner)

For valid parsed handoff, show **one** compact banner (dismissible per session via `sessionStorage` optional — v1: dismissible in-memory only with local `useState`):

1. **Why it matters** — From `(op_src, op_sub, op_band, op_step)` lookup table.
2. **What triggered it** — Restate subsystem + band in plain language (no scores).
3. **What improves / risk reduced** — Single sentence tied to ledger or forecast trust.

No generative text; strings live in code.

---

## 7. Operational workspace integration

- **Command center card** remains the **primary** handoff emitter in v1.
- **Workflow resolution** deep link for oldest pending proposal targets **`#operational-actions`** (alignment with execution).
- **Key destination pages** mount `ExecutionContinuityBanner` inside `<Suspense>` (because of `useSearchParams`).

---

## 8. Security & ownership

- Handoff params are **non-authoritative hints** for UX only.
- All mutations continue to require **session auth** and existing **server-side** checks (`requireAuthSession`, proposal ownership, fingerprint checks).

---

## 9. Non-goals

- No OAuth popups, no third-party “integration dashboards,” no webhook-driven auto-pay from this layer.
- No new **autonomous** `FinancialEvent` types from handoff parsing alone.
- No replacement of `OperationalAlertCards` action matrix in v1.

---

## 10. Rollout

1. Library + tests  
2. Command center DTO + card  
3. Banner on: Money Control, cash flow, invoices index, timing calendar  
4. Workflow panel anchor fix  
5. Follow-up PR: alert cards + panel footers

### Implemented (v1 — 2026-05-13)

- `lib/operational-execution-context` with `op_src` / `op_sub` / `op_band` / `op_step` contract, serialize/parse, deterministic explain copy, unit tests.
- `continuation.executionHandoff` on `UnifiedOperationalCommandCenterDto` from the engine (maps CTA ladder step 1–6 + focus subsystem/band).
- `OperationalCommandCenterCard` appends handoff query to primary CTA and subsystem “Open related view” links.
- `ExecutionContinuityBoundary` (client + Suspense) on `money-control`, `cash-flow`, `operational-center/calendar`, and `income/invoices` pages.
- `/invoices` redirect now **preserves query string** to `/income/invoices` so contractor handoff survives the redirect.
- `WorkflowResolutionPanel` oldest-pending link targets `#operational-actions` instead of `#workflow-resolution`.
