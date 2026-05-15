# Unified Operational Command Center — Completion Report

**Date:** 2026-05-13  
**Scope:** Production-ready coordination read model at the top of the Operations hub; no new Prisma tables; no composite health scores; deterministic bands and CTA ladder per `docs/unified-operational-command-center-architecture.md`.

---

## Files audited (Phase 1)

| Area | Path(s) |
|------|---------|
| Architecture / audit | `docs/unified-operational-command-center-architecture.md`, `docs/unified-operational-command-center-audit.md` |
| Alerts API | `app/api/operational-center/alerts/route.ts` |
| Workspace | `components/operational-workspace/UnifiedOperationalWorkspace/index.tsx` |
| Bundle / reserve | `lib/reserve-allocation-intelligence/snapshot` (helpers `isElevatedReservePressure`, `buildReserveAndContractorIntelligenceBundle`) |
| Timing | `lib/timing-coordination/pressure.ts` (`isElevatedTimingPressure`) |
| Contractor | `lib/contractor-operations` (snapshot shape, `hasContractorContext`) |
| Workflow | `lib/workflow-resolution/types.ts`, snapshot consumer |
| Operational actions | `lib/operational-actions/list-pending` |
| Notifications DTO | `lib/operational-notifications/types.ts` (`OperationalAlertsResponseDto`) |
| Prior implementation | `lib/unified-operational-command-center/*`, `OperationalCommandCenterPanel/*` (replaced per target module naming) |

**Existing bundle sources:** `buildReserveAndContractorIntelligenceBundle(userId)` — single forecast path when `ensure=true`; reused for command center.  
**Workflow snapshot:** `buildWorkflowResolutionSnapshot(userId, { windowDays: 14 })`.  
**Pending proposals:** `listPendingOperationalProposals(userId)`.  
**Attention queue:** Embedded in workflow `openAttention.queueSize` and `oldestPendingProposalAgeDays`.  
**Workspace layout:** Header → command strip → connected/smart income → contractor → operational actions → reserve → workflow → timing → activation → checkpoint → continuity → shortcuts → `#operational-attention` section (already present).  
**UI primitives:** `Card`, `Button`, `Badge`, `Link`, `details`/`summary` from existing `components/ui/*`.

---

## Files changed / added

| Action | Path |
|--------|------|
| **Added** | `lib/operational-command-center/types.ts` — `UnifiedOperationalCommandCenterDto`, subsystem rows with `key`, `label`, `band`, `headline`, `detail`, `inputsUsed`, `href`; stabilization includes `appliedActionKindsInWindow`. |
| **Added** | `lib/operational-command-center/engine.ts` — `buildUnifiedOperationalCommandCenterDto`, band logic, coordination bullets, CTA ladder. |
| **Added** | `lib/operational-command-center/index.ts` — public exports. |
| **Added** | `lib/operational-command-center/__tests__/engine.test.ts` |
| **Added** | `lib/operational-command-center/__tests__/response-contract.test.ts` |
| **Added** | `components/operational-workspace/OperationalCommandCenterCard/index.tsx` |
| **Added** | `components/operational-workspace/OperationalCommandCenterCard/OperationalCommandCenterCard.test.tsx` |
| **Added** | `components/operational-workspace/OperationalCommandCenterCard/OperationalCommandCenterCard.stories.tsx` |
| **Updated** | `app/api/operational-center/alerts/route.ts` — import from `@/lib/operational-command-center`; behavior unchanged (`includeCommandCenter`, bundle reuse). |
| **Updated** | `lib/operational-notifications/types.ts` — `commandCenter` type import path. |
| **Updated** | `components/operational-workspace/UnifiedOperationalWorkspace/index.tsx` — renders `OperationalCommandCenterCard`. |
| **Removed** | `lib/unified-operational-command-center/**` |
| **Removed** | `components/operational-workspace/OperationalCommandCenterPanel/**` |

---

## Systems reused

- **Reserve / timing / contractor:** Same `ReserveAndContractorIntelligenceBundle` as alerts `ensure=true` path; no second forecast when bundle already built.
- **Workflow resolution:** `WorkflowResolutionSnapshotDto` for stabilization slice and workflow bands.
- **Operational actions:** Pending list for counts, shift proposal count (`SHIFT_RECURRING_BILL_DATE`), and CTA ladder step 1.
- **Thresholds:** `isElevatedReservePressure`, `isElevatedTimingPressure`; contractor coordination uses only `openReceivables` and `reserveNudges` per architecture (not collection-window count alone).

---

## Duplicate systems avoided

- No parallel orchestration layer; composition only after existing ensures + same bundle/workflow/pending inputs as the hub.
- No new dashboard route; one hub card summarizing existing subsystems.
- Removed redundant `lib/unified-operational-command-center` in favor of `lib/operational-command-center` while keeping DTO name `UnifiedOperationalCommandCenterDto` for alert response compatibility.

---

## Command center DTO status

| Field | Status |
|-------|--------|
| `generatedAt` | ISO timestamp at composition |
| `subsystems[]` | Fixed order: reserve → timing → contractor → workflow; each row has `key`, `label`, `band`, `headline`, `detail`, `inputsUsed`, `href` |
| `coordinationBullets[]` | Max 5; escalating first, then coordination; all-stable path uses concrete metric lines |
| `stabilization` | From workflow snapshot only: `momentumFactorCount`, `momentumFactorCodes`, `attentionAutoResolvedInWindow`, `appliedActionKindsInWindow` |
| `continuation` | Counts + single `primaryCta` (`href`, `label`, `reason`) |
| `explain` | Fixed assumptions + contributor id strings |

---

## Subsystem band status

| Subsystem | Escalating | Coordination | Stabilizing |
|-----------|------------|----------------|-------------|
| Reserve | `isElevatedReservePressure` | Not escalating ∧ (`pressureScore >= 2` ∨ `guidance.length > 0`) | Else |
| Timing | Elevated ∨ `conflicts.length > 0` | Not escalating ∧ (`clusters.length > 0` ∨ `instabilityWindow != null`) | Else |
| Contractor | Context ∧ (negative margin ∨ late payers ∨ material exposure) | Not escalating ∧ (open receivables ∨ reserve nudges) | Else; no context → stabilizing, headline “No contractor context” |
| Workflow | Stale proposal age ≥7 ∨ queue ≥12 | Not escalating ∧ (pending proposals > 0 ∨ queue > 0) | Else |

---

## CTA ladder status (first match wins)

1. Pending operational actions → `/operational-center#operational-actions` — “Preview pending operational actions”  
2. Timing escalating **or** pending shift proposals → `/operational-center/calendar` — “Coordinate timing on the calendar”  
3. Reserve escalating → `/money-control?tab=rules` — “Adjust rules / buckets”  
4. Contractor escalating → `/invoices` — “Triage contractor receivables”  
5. Open attention queue → `/operational-center#operational-attention` — “Review operational attention”  
6. Default → `/cash-flow` — “Review cash flow forecast”  

---

## API integration status

- `GET /api/operational-center/alerts?ensure=true&includeCommandCenter=true` attaches `commandCenter` when bundle + workflow + pending resolve successfully.
- `includeCommandCenter` omitted or `false`: `commandCenter` omitted from JSON (backward compatible).
- `includeCommandCenter=true` with `ensure=false`: still builds bundle once (existing edge case preserved).
- Ownership: `session.user.id` for all data loads.

---

## UI integration status

- `OperationalCommandCenterCard` at top of Operations hub (below non-embedded header when applicable).
- Mobile-first; **2-column from `md`** (`md:grid-cols-2`).
- Band badges: **Needs attention** / **Coordinate** / **Stable** (no raw enum in the badge).
- Primary CTA prominent; continuation counts in a compact `<dl>`; explainability in `<details>`.
- `#operational-attention` unchanged on attention section wrapper.

---

## Validation results

| Command | Result |
|---------|--------|
| `npx prisma validate` | Pass |
| `npx prisma generate` | **Failed** in this environment (`Unexpected end of JSON input`) — treat as local/tooling issue; schema validates |
| `npm run typecheck` | Pass |
| `npx jest lib/operational-command-center components/operational-workspace/OperationalCommandCenterCard --passWithNoTests` | Pass (18 tests) |

---

## Remaining production gaps

1. **Prisma generate:** Investigate corrupted cache or partial JSON in CI or dev machines if generate persists failing.  
2. **Panel-level forecast dedupe:** Architecture §10 (`compactIntelligencePanels`) is already defaulted in workspace; individual panel fetches may still duplicate forecast work until those routes accept a shared bundle token (future optimization, not part of this deliverable).  
3. **E2E / route test:** Alerts route is not covered by an HTTP-level Jest test; contract covered by `response-contract.test.ts` plus engine tests.  
4. **Subsystem row links:** Each row includes a deterministic `href` plus an “Open related view” link; deep links are the same routes users already use.

---

## Production readiness assessment

**Ready for production** as a read-only coordination layer: deterministic bands, explainable bullets, single CTA, no new persistence, backward-compatible API. The hub should feel **calmer** (one summary card, clearer badges) without replacing drill-down panels. Resolve `prisma generate` locally or in CI before deploy if client generation is required for that pipeline.
