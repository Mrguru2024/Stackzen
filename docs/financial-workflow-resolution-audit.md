# Financial workflow resolution & habit reinforcement — audit (Phase 1)

This audit maps **existing** StackZen systems that touch operational follow-through, lifecycle, and reinforcement before adding any new layer. Goal: confirm we can derive workflow-resolution and reinforcement signals from the existing **`FinancialEvent`** + **`AutomationNotification`** ledgers, without inventing duplicate trackers, fake streaks, or new “engagement” surfaces.

## 1. Existing workflow systems

| Area | Location | Role |
|------|----------|------|
| **Operational financial actions (proposals)** | `lib/operational-actions/build-proposals.ts`, `ensure-proposals.ts`, `metadata.ts` | Deterministic proposals (`PAUSE_AUTOMATION_RULE`, `RECORD_GOAL_CONTRIBUTION`, `EXTEND_GOAL_TARGET_DATE`) attached to `AutomationNotification.metadata.operationalActionProposal` with `version: 1`, `status`, `fingerprint`, `payload`, `explain`. |
| **Apply** | `lib/operational-actions/apply.ts` | Validates live fingerprint, performs the canonical mutation, writes `FinancialEvent` `OPERATIONAL_FINANCIAL_ACTION_APPLIED` with `forecastBeforeAt` / `forecastAfterAt`, marks notification read + status `applied`. |
| **Dismiss** | `lib/operational-actions/dismiss.ts` | Updates metadata `status='dismissed'` and stamps `dismissedAt`; marks notification read. |
| **Preview** | `lib/operational-actions/preview.ts` | Returns deterministic before-summary + staleness; no event write. |
| **Listing** | `lib/operational-actions/list-pending.ts` | Selects pending proposals via `attentionKind` prefix `operational_action_*` and `status === 'pending'`. |
| **Reserve / contractor / income / connectivity ensures** | `lib/reserve-allocation-intelligence/ensure-attention.ts`, `lib/contractor-operations/ensure-attention.ts`, etc. | Upsert portfolio alerts; auto-resolve via `mergeNotificationMetadata` + `readAt`. |

## 2. Existing operational continuity systems

| Area | Location | Role |
|------|----------|------|
| **`UserOperationalCheckpoint`** | `prisma/schema.prisma`, `lib/operational-state/checkpoint-payload.ts` | Persistent JSON for `moneyControl`, `workspace.focusAlertId`, `activation.dismissedNbaKeys`, `activation.milestoneEventsEmitted`. Server merge via `mergeOperationalCheckpoint`. |
| **Reconcile derived attention** | `lib/operational-state/reconcile-derived-attention.ts` | Auto-resolves `guidance_*`, `cashflow_*`, derived goal kinds, business invoice/job kinds when underlying state resolves; writes `OPERATIONAL_ATTENTION_AUTO_RESOLVED` events. |
| **Operational Workspace** | `components/operational-workspace/UnifiedOperationalWorkspace/index.tsx` | Adaptive shortcuts, ranked attention queue, panels; resume link to Money Control via checkpoint. |

## 3. Existing action lifecycle systems

| State | Source-of-truth |
|-------|------------------|
| Issued | `AutomationNotification.createdAt` + `metadata.operationalActionProposal.status === 'pending'` |
| Reviewed | _(implicit, no event today)_ — preview is read-only, no write to `FinancialEvent` |
| Applied | `FinancialEvent.OPERATIONAL_FINANCIAL_ACTION_APPLIED` (created in `apply.ts`) + notification metadata `status='applied'` + `appliedAt` |
| Dismissed | `AutomationNotification.metadata.dismissedAt` + `metadata.operationalActionProposal.status='dismissed'` |
| Auto-resolved | `FinancialEvent.OPERATIONAL_ATTENTION_AUTO_RESOLVED` from `reconcile-derived-attention.ts` |
| Activation milestones | `FinancialEvent.OPERATIONAL_ACTIVATION_MILESTONE` from `lib/operational-activation/record-milestones.ts` (de-duplicated by checkpoint `activation.milestoneEventsEmitted`) |

## 4. Existing measurable outcome systems

| Outcome | Where it lives |
|---------|-----------------|
| Forecast before/after | `apply.ts` runs `buildCashFlowForecast` before and after each mutation; persists `forecastBeforeAt` / `forecastAfterAt` (timestamps) in event metadata. The full balance summary is also returned to the client via `OperationalActionApplyResultDto`. |
| Goal progress | `lib/goals/apply-contribution.ts` writes `GOAL_CONTRIBUTION_RECORDED` events with `amount`, optional milestone, and bucket-balance changes; `GOAL_MILESTONE_REACHED` for crossings. |
| Reserve pressure (snapshot) | `lib/reserve-allocation-intelligence/snapshot.ts` — `pressureScore = factor count` (deterministic, no history table). |
| Contractor stress (snapshot) | `lib/contractor-operations/snapshot.ts` — material exposure, negative margin, AR concentration, late payers. |
| Cash flow risk codes | `lib/cashflow/risk.ts` (e.g. `PROJECTED_LOW_BALANCE`, `ALLOCATION_PRESSURE`, …). |

## 5. Existing reinforcement logic

| Surface | Behavior |
|---------|----------|
| Activation milestones | Recorded once per step in `FinancialEvent`; `OperationalActivationPanel` renders progressive tier — closest existing reinforcement surface, but step-based (not streak-based). |
| Workspace alert resolution | `OperationalAlertCards` updates as alerts auto-resolve or are dismissed; visible reduction in attention queue. |

**Finding:** No streak / badge / point system anywhere. Reinforcement is currently **implicit** in “queue shrinks when behavior improves.”

## 6. Duplication risks

1. **A second per-action lifecycle table** would duplicate `AutomationNotification.metadata` and `FinancialEvent` — **forbidden**.
2. **A second “improvement timeline”** would duplicate `FinancialEvent` (already append-only and indexed). Read from `FinancialEvent` directly.
3. **A subjective “financial health” score** is explicitly disallowed by the spec; must remain factor-count or event-count semantics.
4. **An auto-pushed “great work!” notification** would be **dopamine-driven engagement spam** — disallowed. Reinforcement must be **passive**, surfaced in the workspace, never as new push notifications.
5. **Re-running forecast for momentum metrics** would duplicate forecast cost; reuse `forecastBeforeAt/After` already stored in `OPERATIONAL_FINANCIAL_ACTION_APPLIED` metadata.

## 7. Missing workflow-resolution flows (gaps)

| Gap | Operational interpretation |
|-----|----------------------------|
| **Action-resolution rate visibility** | No aggregate of pending vs applied vs dismissed per window today. |
| **Auto-resolution visibility** | `OPERATIONAL_ATTENTION_AUTO_RESOLVED` exists but isn’t surfaced as a deterministic “these signals stabilized” count. |
| **Goal contribution momentum** | `GOAL_CONTRIBUTION_RECORDED` events exist; no aggregate “in last N days, $X contributed across N goals.” |
| **Continuation cues for stale pending** | Pending proposals don’t expire; we should highlight oldest pending so users finish them — but **without creating a new notification kind**. |

## 8. Recommended operational architecture

1. **`buildWorkflowResolutionSnapshot(userId, opts?)`** — Pure read of `FinancialEvent` (last `windowDays`, default 14) + `AutomationNotification` queue. Aggregates:
   - Recommendations issued (proposal rows created in window — derived from notification `createdAt` where `attentionKind` starts with `operational_action_`)
   - Applied actions per kind, plus most recent forecast before/after timestamps from event metadata
   - Dismissed actions in window
   - Attention auto-resolved in window (`OPERATIONAL_ATTENTION_AUTO_RESOLVED`)
   - Goal contributions in window (count + total USD)
   - Goal milestones reached in window
   - Activation milestones in window
   - Open attention right now (queue size, plus oldest pending proposal age)
2. **`buildResolutionMomentumSignals(...)`** — Pure deterministic factor list (each is a binary “did follow-through happen?” derived from counts), with `reasoning[]`. No score, no streak. Count is the only number we surface.
3. **API:** `GET /api/operational-center/workflow-resolution?windowDays=14`. Snapshot only — **no `ensure`, no notification side-effect**.
4. **UI:** `WorkflowResolutionPanel` — passive card embedded in `UnifiedOperationalWorkspace` after `ReserveAllocationIntelligencePanel`. Lists counts, oldest pending, and explainer text. Avoids confetti / streaks / “you’re on fire” copy.
5. **No new Prisma model. No new alert kind. No new `FinancialEvent` types.**

## 9. Safe implementation strategy

1. Read-only on snapshot/API; ownership-scoped via `requireAuthSession` and `userId` filters.
2. Bound queries (`take`) to keep hub refresh cheap; `windowDays` clamped to `[1, 60]`.
3. Tests: pure aggregation function tests over a synthetic event array; component renders snapshot.
4. **Validation:** `prisma validate`, `tsc --noEmit`, targeted Jest. Document Windows EPERM caveat for the generated client.
5. Leave `apply.ts` and `dismiss.ts` unchanged — already audit-clean.

## Files explicitly reviewed

- `prisma/schema.prisma` (`FinancialEvent`, `FinancialEventType` enum, `UserOperationalCheckpoint`, `AutomationNotification`)
- `lib/operational-actions/*` (apply, dismiss, preview, list-pending, build-proposals, metadata, fingerprint, types)
- `lib/operational-state/reconcile-derived-attention.ts`, `checkpoint-payload.ts`
- `lib/operational-activation/record-milestones.ts`, `derive-state.ts`
- `lib/financial-events/events.ts`
- `lib/operational-notifications/helpers.ts`, `enrich.ts`
- `app/api/operational-center/operational-actions/route.ts`, `alerts/route.ts`, `checkpoint/route.ts`
- `components/operational-workspace/UnifiedOperationalWorkspace/index.tsx`
