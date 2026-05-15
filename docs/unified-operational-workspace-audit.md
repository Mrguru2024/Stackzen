# Unified Operational Workspace — Phase 1 Audit

**Scope:** Map how StackZen currently surfaces operational work (alerts, money, forecast, goals) and where fragmentation or passive UI risks live. **No new disconnected dashboard** — orchestration must reuse existing queues and routes.

**Date:** 2026-05-10

---

## 1. Existing operational surfaces

| Surface | Route / entry | Role |
|---------|----------------|------|
| **Operational Center** | `/operational-center` | `OperationalAlertCenter` → fetch `GET /api/operational-center/alerts?ensure=true`, domain filters, `OperationalAlertCards`. |
| **Money Control** | `/money-control` | Tabs: review, rules, alerts, buckets, activity; `?tab=` + `txnId` deep links from operational actions. |
| **Cash Flow** | `/cash-flow` | Deterministic forecast UI (`CashFlowView`). |
| **Operational Goals** | `/goals/operational` | Goal pacing, contributions, analysis. |
| **Financial Timeline** | `/financial-timeline` | `FinancialEvent`-driven timeline. |
| **Dashboard** | `/dashboard` | General landing (risk: passive widgets if overloaded). |
| **Income Hub** | `/income-hub` | Income-oriented entry (profile-dependent). |

---

## 2. Existing action workflows

- **Operational actions** — `AutomationClientAction` (`OPEN_CASH_FLOW`, `OPEN_MONEY_CONTROL`, `OPEN_INVOICE`, `OPEN_JOB`, `OPEN_OPERATIONAL_GOAL`, `CREATE_GOAL`, `SNOOZE`, etc.) resolved in `OperationalAlertCards`.
- **Ensure pipeline** — `ensureOperationalAttentionNotifications` → `ensureCashflowAttentionNotifications` → `ensureGoalPlanningAttentionNotifications` → `ensureGuidanceAttentionNotifications` (order in `alerts/route.ts`).
- **Notification lifecycle** — `PATCH /api/automation/notifications/[id]` (read, snooze, dismiss, `guidanceApplied`).

---

## 3. Existing prioritization systems

- **Alert DTO** — `uiPriority` from severity + read + dismiss (`enrich.ts`).
- **Attention queue** — `inAttentionQueue` (unread, not snoozed/dismissed).
- **Severity** — `NotificationSeverity` on `AutomationNotification`.
- **Cash flow risks** — `RiskFindingDto.severity` + `confidence`.
- **Guidance** — `metadata.guidance.priority` + risk linkage.
- **No global cross-domain ranker** before this work — **gap**.

---

## 4. Fragmentation risks

- Multiple finance links (Operational Center, Cash Flow, Money Control, Goals) without a **single orchestrated first screen**.
- **Duplicate semantics**: cashflow `cashflow_*` alerts vs guidance `guidance_*` for the same underlying forecast risk code — users can see two cards.
- Income-profile **nav filtering** (`navKeys`) may **hide** money tools for some profiles even when automation/forecast data exists.

---

## 5. Navigation overload risks

- `NavLinks` has many entries; sidebar filters by `featureKey` ∩ `activation.navKeys`.
- Finance tools are **not** in every profile’s `navKeys` today → inconsistent access to operational workflows.

---

## 6. Existing attention-management systems

- **Grouped API** — `OperationalAlertsResponseDto.grouped` by `OperationalUiDomain` (`financial`, `automation`, `work`, `invoice`, `billing`, `goals`, `guidance`).
- **Domain inference** — `inferDomain` uses `attentionKind` prefixes and related entities.
- **Trust block** — `OperationalTrustDto` on every card.

---

## 7. Missing orchestration workflows

- **Unified priority queue** across domains with explicit scoring.
- **Safe deduplication** of alerts that share the same underlying risk fingerprint.
- **Adaptive layout** driven by income profile (e.g. contractor → elevate invoice/job-linked items).
- **Workflow continuity** copy (review → correct → confirm) surfaced **once** at workspace level, not repeated per feature team.

---

## 8. Recommended workspace architecture

1. **Single hub URL** — Enhance **`/operational-center`** (no second “dashboard” route): host `UnifiedOperationalWorkspace`.
2. **Server/client data** — Reuse existing `GET /api/operational-center/alerts` + `GET /api/income-profiles/activation`.
3. **Priority engine** — `lib/workspace/priority-engine.ts`: `dedupeOperationalAlerts`, `rankOperationalAlerts`.
4. **DTO extension** — `dedupeKey` on `OperationalAlertDto` (from notification metadata: `guidance.riskCode`, `cashflow_*` attentionKind, or entity id).
5. **Activation** — Add `operational-center`, `cash-flow`, `money-control`, `goals/operational` to **all** profile `navKeys` so the hub and its deep links are reachable under income-profile gating.
6. **UI** — One page: adaptive shortcuts row (real links only) + prioritized `OperationalAlertCards` + short workflow strip.

---

## 9. Safe implementation strategy

1. Land audit + architecture docs.  
2. Add `dedupeKey` in `enrich.ts` (backward compatible).  
3. Implement priority engine + tests.  
4. Build `UnifiedOperationalWorkspace` and swap `operational-center/page.tsx` body.  
5. Update `profileActivationMap` navKeys consistently.  
6. Optionally rename nav label to **“Operations hub”** (same `href`, same `featureKey`).  
7. Validate Prisma + typecheck + document gaps (e.g. partial dedupe when metadata missing).

---

## Files reviewed (sampling)

- `app/(dashboard)/operational-center/page.tsx`, `components/operational-center/*`  
- `app/api/operational-center/alerts/route.ts`  
- `lib/operational-notifications/*`, `lib/cashflow/*`, `lib/guidance/*`, `lib/goals/*`  
- `config/nav-links.ts`, `components/sidebar.tsx`, `lib/income-profiles/activation.ts`, `app/api/income-profiles/activation/route.ts`  

---

*End of Phase 1 audit.*
