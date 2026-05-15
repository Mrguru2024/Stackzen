# Unified Operational Command Center — Phase 1 Audit

**Scope:** StackZen Next.js 15 App Router, Prisma canonical models, existing operational intelligence layers.  
**Date:** 2026-05-13  
**Rule:** No new generic dashboards; no synthetic “health” scores; deterministic, explainable state only.

---

## 1. Existing operational systems

| System | Role | Primary artifacts |
|--------|------|---------------------|
| **Operational workspace** | `UnifiedOperationalWorkspace` composes many panels; loads `/api/operational-center/alerts?ensure=true` + activation + checkpoint. | Client UI orchestration |
| **Operational alerts API** | `GET /api/operational-center/alerts` runs multiple `ensure*` routines, then loads `AutomationNotification` + `FinancialEvent`, enriches, **dedupes** (`dedupeOperationalAlerts`), returns `grouped` by domain. | `AutomationNotification`, `FinancialEvent` |
| **Reserve allocation intelligence** | `buildReserveAndContractorIntelligenceBundle` → reserve snapshot (factors, pressure score, guidance, discretionary stats, goals). Shares **one** `buildCashFlowForecast(includeDetails: true)` with contractor + timing. | `lib/reserve-allocation-intelligence/*` |
| **Timing coordination** | `buildTimingCoordinationSnapshotFromForecast` inside bundle; clusters, conflicts, instability, guidance; `ensureTimingCoordinationAttentionNotifications`. | Forecast + Prisma bills/invoices/goals |
| **Contractor operations** | `buildContractorFinancialOpsSnapshot`; jobs, AR, concentration, late payers, collection timing, reserve nudges. | Same bundle forecast |
| **Workflow resolution** | `buildWorkflowResolutionSnapshot` from `FinancialEvent` + `AutomationNotification` scan; momentum **factor count** (explicitly not a health score), applied aggregates, open attention. | `FinancialEvent`, `AutomationNotification` |
| **Operational actions** | `ensureOperationalActionProposals`, `listPendingOperationalProposals`, preview/apply/dismiss APIs; kinds include shift bill, prepare reserve, pause rule, goal contribution, extend goal. | `AutomationNotification.metadata.operationalActionProposal` |
| **Operational notifications** | `buildOperationalAlertDto`, `OperationalExplainabilityDto`, dedupe keys, domains (`financial`, `guidance`, …). | Enrichment on notifications |
| **Guidance** | `ensureGuidanceAttentionNotifications` from guidance engine; surfaces as alerts with structured metadata. | Alerts pipeline |
| **Forecast** | `buildCashFlowForecast` — canonical cashflow projection; risks, windows, explain inputs. | Consumed by reserve/timing/contractor |
| **Orchestration** | Alerts route sequences ensures; `reconcileDerivedOperationalAttention`; optional integrity scan. | Single hub entry |
| **Explainability** | Per-alert `explainability`; subsystem `explain` blocks on reserve/timing/contractor/workflow snapshots. | Structured DTOs |

**Reinforcement:** Workflow resolution exposes **momentum factors** (counts of follow-through event categories in a window) — not gamification; explicitly documented as non-scores in `WorkflowResolutionSnapshotDto`.

---

## 2. Existing operational visibility layers

- **UnifiedOperationalWorkspace** stacks: Connected (bank), Smart Income, Contractor, **Operational financial actions**, Reserve intelligence, **Workflow resolution**, **Timing coordination**, activation, checkpoint, workflow continuity shortcuts, **ranked** `OperationalAlertCards`.
- **Dedicated routes:** `/operational-center/calendar` (interactive timing calendar only).
- **Per-domain APIs:** `reserve-allocation-intelligence`, `timing-coordination`, `workflow-resolution`, `contractor-operations`, `operational-actions`, `income-intelligence`, etc.

Each panel independently `fetch`es its snapshot → **multiple round-trips** and **duplicate forecast work** unless the client hits endpoints that internally reuse the bundle (reserve standalone route still calls `buildReserveAllocationSnapshot` → full bundle path).

---

## 3. Existing workflow continuity systems

- **Checkpoint API** (`/api/operational-center/checkpoint`) — resume Money Control transaction review.
- **OperationalFinancialActionPanel** — list pending proposals, preview, apply, dismiss (`#operational-actions`).
- **WorkflowResolutionPanel** — open attention, dismissed counts, applied kinds, momentum factors.
- **Workspace “Workflow continuity” card** — static links to Money Control / Cash flow.
- **Alert cards** — `actions[]` from actionable metadata; `onMutate` refresh.

---

## 4. Existing escalation systems

- **Severity** on `AutomationNotification` → mapped to `OperationalAlertDto.uiPriority` / ranking in `rankOperationalAlerts` (attention queue, severity, domain boosts by income profile).
- **Dedupe** — `dedupeOperationalAlerts` collapses cashflow vs guidance duplicates by `dedupeKey`.
- **Subsystem-specific ensures** — reserve / timing / contractor / cashflow / goals / guidance each create or update attention rows with idempotent keys.

There is **no single “escalation coordinator”** object — escalation is implicit in alert ranking + multiple independent thresholds.

---

## 5. Existing explainability systems

- `OperationalExplainabilityDto` on each alert.
- `explain.assumptions` + `explain.inputsUsed` on reserve, timing, contractor, workflow snapshots.
- Trust blocks (`why`, `whatChanged`, `recommendedNextStep`) on actionable notifications.

---

## 6. Duplication / fragmentation risks

| Risk | Evidence | Impact |
|------|----------|--------|
| **Repeated operational summaries** | Reserve panel + timing panel + workflow panel each restate “pressure” / “factors” in separate cards. | Cognitive overload; no single “what matters first” strip. |
| **Duplicate forecast cost** | Hub `alerts` uses bundle once; individual panels re-fetch their APIs → extra `buildCashFlowForecast` calls on same page. | Latency, DB/CPU load. |
| **Disconnected workflow visibility** | Pending actions panel is separate from workflow resolution and from timing “shift” proposals. | User must scroll to correlate. |
| **Overlapping alerts** | Mitigated server-side by `dedupeOperationalAlerts`; client still receives large ranked list. | Queue can feel noisy without coordinated headline. |
| **Stale coordination** | If user dismisses in one panel but another panel cached old snapshot until refresh. | Minor; refresh buttons exist per panel. |
| **Operational UX overload** | Many large cards before prioritized queue. | Hard to answer “what do I do next?” in one glance. |

---

## 7. Missing operational coordination workflows

1. **Unified operational state object** — single DTO tying reserve band, timing band, contractor band, workflow continuation, without inventing a composite score.
2. **Coordinated escalation narrative** — deterministic bullets: which subsystems are in **escalating** vs **needs coordination** vs **stabilizing** (using existing thresholds only).
3. **One continuation CTA** — primary next step among: pending operational actions, timing calendar, Money Control, goals — based on explicit priority rules.
4. **Single hub response extension** — optional payload alongside alerts after shared bundle compute to avoid duplicate forecast (when `ensure=true`).

---

## 8. Recommended operational architecture

1. **`lib/unified-operational-command-center`** — pure builder `buildUnifiedOperationalCommandCenterDto(bundle, workflow, pendingProposals)`:
   - Subsystem rows with `band: 'escalating' | 'coordination' | 'stabilizing'`, `headline`, `detailLines[]`, `inputsUsed` (subset of existing snapshot fields).
   - **Stabilization** slice: reuse workflow `momentumFactorCount`, factor codes, `attentionAutoResolvedInWindow`, applied kind list — no new metrics.
   - **Continuation** slice: counts from `listPendingOperationalProposals` + `workflow.openAttention` + count of `SHIFT_RECURRING_BILL_DATE` pending.
2. **`GET /api/operational-center/alerts?includeCommandCenter=true`** — after ensures, if bundle exists reuse it; else build bundle once when command center requested; attach `commandCenter` to JSON.
3. **UI:** One **`OperationalCommandCenterPanel`** at top of workspace — compact, link-driven, uses `commandCenter` from first load; **does not** replace deep-dive panels (they remain for drill-down).

---

## 9. Safe implementation strategy

1. Add types + pure builder + unit tests (injected fixtures — no Prisma in tests).
2. Extend alerts route and `OperationalAlertsResponseDto` (optional field).
3. Update `UnifiedOperationalWorkspace` fetch URL + state + render command panel once.
4. Do **not** add new Prisma models; do **not** add new `ensure*` loops; do **not** introduce composite scores.
5. Document Phase 2 architecture in `docs/unified-operational-command-center-architecture.md`.
6. **Follow-up:** With the command center live, default **`compactIntelligencePanels`** on the hub so reserve / timing / workflow / contractor panels shorten prose and fold long context into `<details>` — same APIs, less duplicate narrative (see architecture §10).

---

## Audit conclusion

The platform already has strong **deterministic** subsystems and a **deduped** attention pipeline. The gap is **coordination UX** and **a unified read model** that respects the single bundle used during hub refresh. The command center fills that gap without duplicating orchestration or inventing fake scores.
