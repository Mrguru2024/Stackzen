# Unified Operational Command Center — Phase 2 Architecture

**Principles:** Deterministic; explainable; no composite “health” scores; reuse `FinancialTransaction`, `FinancialEvent`, `AutomationNotification`, existing snapshots and thresholds.

---

## 1. Unified operational state

### Inputs (server-side, single hub refresh)

| Input | Source |
|-------|--------|
| `ReserveAndContractorIntelligenceBundle` | `buildReserveAndContractorIntelligenceBundle(userId)` — already used by `alerts` when `ensure=true` |
| `WorkflowResolutionSnapshotDto` | `buildWorkflowResolutionSnapshot(userId, { windowDays: 14 })` |
| Pending proposals | `listPendingOperationalProposals(userId)` |

### Output: `UnifiedOperationalCommandCenterDto`

- **`generatedAt`:** ISO timestamp of composition.
- **`subsystems[]`:** Fixed four rows in stable order: `reserve` → `timing` → `contractor` → `workflow`.
- **`coordinationBullets[]`:** Max 5 strings; each must map to a concrete condition (e.g. “Reserve pressure elevated: critical low balance or factor count ≥ threshold”).
- **`stabilization`:** Subset of workflow snapshot only — `momentumFactorCount`, `momentumFactorCodes`, `attentionAutoResolvedInWindow`, `appliedActionKindsInWindow` (distinct kinds with count > 0).
- **`continuation`:** Counts + **one** primary CTA (`href`, `label`, `reason`) from priority ladder below.
- **`explain`:** `assumptions[]`, `contributors[]` (which engines contributed strings).

---

## 2. Operational subsystem bands (deterministic)

Each subsystem gets `band: escalating | coordination | stabilizing`.

### Reserve (`reserve`)

- Read `reserve.pressureScore`, `reserve.factors`, `reserve.explain.inputsUsed.elevatedAttention` equivalent: `isElevatedReservePressure({ factorsLen: pressureScore, hasCriticalLowBalance })` where `hasCriticalLowBalance` = any factor code `PROJECTED_LOW_BALANCE_CRITICAL` **or** forecast risk critical (already embedded in reserve builder). **Use same helper as ensure-attention:** factorsLen = `pressureScore` from snapshot (this matches `isElevatedReservePressure` usage in ensure-attention which passes `factorsLen: score` — the score IS the factor count in reserve pressure).

Check `ensureReserveAllocationAttentionNotifications` - it uses isElevatedReservePressure({ factorsLen: score, hasCriticalLowBalance }) where score = reservePressureScore(factors).

- **escalating:** `isElevatedReservePressure(...)` true.
- **coordination:** not escalating AND (`pressureScore >= 2` OR `guidance.length > 0`).
- **stabilizing:** otherwise.

### Timing (`timing`)

- `denseCluster = clusters.some(c => c.dense)`
- `hasReservePrepBehind = reservePrepGoals.length > 0`
- `factorsLen = timing.pressureScore` (same as factor count in timing snapshot)

Use `isElevatedTimingPressure({ factorsLen, hasDenseCluster: denseCluster, hasReservePrepBehind })`.

- **escalating:** elevated OR `conflicts.length > 0`.
- **coordination:** not escalating AND (`clusters.length > 0` OR `instabilityWindow != null`).
- **stabilizing:** otherwise.

### Contractor (`contractor`)

Only if `hasContractorContext`:

- **escalating:** `negativeMarginJobs.length > 0` OR `latePayerClients.length > 0` OR `materialExposure.length > 0`.
- **coordination:** not escalating AND (`openReceivables.length > 0` OR `reserveNudges.length > 0`).
- **stabilizing:** else.

If `!hasContractorContext`: **stabilizing** with headline “No contractor context”.

### Workflow (`workflow`)

- `pendingOps = pendingProposals.length`
- `queueSize = openAttention.queueSize`
- `staleProposal = oldestPendingProposalAgeDays != null && oldestPendingProposalAgeDays >= 7`

- **escalating:** `staleProposal` OR `queueSize >= 12`.
- **coordination:** not escalating AND (`pendingOps > 0` OR `queueSize > 0`).
- **stabilizing:** not escalating AND not coordination (e.g. quiet queue and no pending ops).

---

## 3. Operational priority / continuation CTA (single ladder)

Evaluate top to bottom; first match wins:

1. `pendingOps > 0` → `#operational-actions` — “Preview pending operational actions”.
2. `timing` band === `escalating` OR pending shift proposals count > 0 → `/operational-center/calendar` — “Coordinate timing on the calendar”.
3. `reserve` band === `escalating` → `/money-control?tab=rules` — “Adjust rules / buckets”.
4. `contractor` band === `escalating` → `/invoices` — “Triage contractor receivables”.
5. `queueSize > 0` → `#operational-attention` (add anchor on alert section) OR stay generic `#` — better add `id="operational-attention"` on the attention section wrapper.
6. Default → `/cash-flow` — “Review cash flow forecast”.

Pending shift proposals: count proposals where `kind === 'SHIFT_RECURRING_BILL_DATE'`.

---

## 4. Workflow continuity (surface in DTO only)

- `continuation.pendingOperationalActionsCount`
- `continuation.pendingShiftBillProposalsCount`
- `continuation.openAttentionQueueSize`
- `continuation.oldestPendingProposalAgeDays` (from workflow `openAttention`)

---

## 5. Stabilization view (no new scores)

Expose only existing workflow fields:

- `momentumFactorCount`, list of factor `code`s, `attentionAutoResolvedInWindow`, distinct `OperationalActionKind` with `count > 0` from `appliedActions`.

---

## 6. Explainability

- `explain.assumptions`: fixed strings documenting bands and CTA ladder.
- `explain.contributors`: e.g. `['reserve-allocation-intelligence', 'timing-coordination', 'contractor-operations', 'workflow-resolution', 'operational-actions/list-pending']`.

Each subsystem row includes `inputsUsed` (flat primitives) copied from existing snapshot fields for traceability.

---

## 7. Command center UX

- **One** card at top of Operations hub: title “Operational command center”.
- Layout: 2-column on `md+`: left = subsystem mini-rows (badge + headline + 1-line detail); right = stabilization + primary CTA button + continuation counts.
- Links to existing routes only; no new pages required (optional future: `/operational-center/command` — **out of scope**; keep hub-embedded).

---

## 8. API contract

`GET /api/operational-center/alerts?ensure=true&includeCommandCenter=true`

Response adds:

```ts
commandCenter?: UnifiedOperationalCommandCenterDto;
```

When `includeCommandCenter=false` or omitted: field omitted.

When `ensure=false` but `includeCommandCenter=true`: build bundle once + workflow + pending (documented edge case for lightweight clients).

---

## 9. Non-goals

- No new Prisma tables.
- No OAuth / external widgets.
- No replacement of `OperationalAlertCards` or individual intelligence panels in v1 — command center **summarizes** only.

---

## 10. Intelligence panel compact mode (post–command center)

On the Operations hub, `UnifiedOperationalWorkspace` passes `compactIntelligencePanels` (default **true**) into:

- `ReserveAllocationIntelligencePanel`
- `TimingCoordinationPanel`
- `WorkflowResolutionPanel`
- `ContractorFinancialOperationsPanel`

When `compactSummary` is true, each panel:

- Uses a **short** `CardDescription` that defers headline bands to the command center.
- Keeps **actionable** lists and links; moves long rule samples, discretionary breakdowns, factor reasoning, collection reasoning, or cluster event lines into **`<details>`** or **truncated lists** with “+N more” hints.

Storybook and tests can pass `compactIntelligencePanels={false}` / `compactSummary={false}` for full narrative layouts. Standalone use of panels defaults to **full** layout (`compactSummary` omitted).
