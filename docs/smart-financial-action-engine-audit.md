# Smart Financial Action Engine — Phase 1 audit

Audit of existing StackZen systems that **recommend**, **surface**, **mutate**, or **audit** financial operations — completed before implementing the operational action engine.

## 1. Existing actionable systems

| System | Location | Behavior |
|--------|----------|----------|
| **Automation client actions** | `lib/financial-automation/actionable-metadata.ts` | Typed `AutomationClientAction` union: deep links to Money Control, Cash Flow, goals, invoices, rules (`EDIT_ALLOCATION_RULE`), snooze, etc. **Navigation only** — no server-side execution from metadata alone. |
| **Guidance engine** | `lib/guidance/engine.ts` | Deterministic `GuidanceRecommendation[]` from `buildCashFlowForecast`, goal analysis, invoices, guardrails. Each rec includes `clientActions` + structured `explain`. |
| **Guidance → attention queue** | `lib/guidance/ensure-guidance-notifications.ts` | Upserts `AutomationNotification` rows with `attentionKind: guidance_*`, embeds forecast inputs and calculations in JSON. |
| **Cashflow risks → attention** | `lib/cashflow/ensure-cashflow-attention.ts` | Upserts `cashflow_<riskCode>` notifications from forecast risks. |
| **Goal milestones / contributions** | `lib/goals/apply-contribution.ts` | `recordGoalContribution` writes `SmartAllocation`, updates `SmartBucket`, `FinancialEvent` (`GOAL_CONTRIBUTION_RECORDED`, optional milestone). **Explicit amount** required. |
| **Goal PATCH** | `app/api/goals/operational/[id]/route.ts` | User-driven updates (target, date, status) + `GOAL_UPDATED` event. |
| **Automation rule PATCH** | `app/api/automation/rules/[id]/route.ts` | `enabled`, `priority`, `name` — supports **pausing** rules without deleting them. Tier limits on concurrent enabled rules. |
| **Income intelligence ensure** | `lib/income-intelligence/ensure-attention.ts` | Pattern for idempotent operational notifications with auto-resolve when signals clear. |

## 2. Existing operational workflows

- **Operations hub** — `app/(dashboard)/operational-center/page.tsx` + `UnifiedOperationalWorkspace`: loads alerts (`GET /api/operational-center/alerts?ensure=true`), adaptive activation, connectivity, income panel, `OperationalAlertCards`.
- **Money Control** — review tab + rules tab for ledger and automation.
- **Cash Flow** — deterministic forecast and risk explain payload.
- **Operational goals** — `/goals/operational` surfaces analysis + contributions via API.

## 3. Existing recommendation / action links

- Guidance recommendations carry **`clientActions`** (open surfaces) but **no bundled “apply” mutation** — users must perform edits manually.
- Cashflow/guidance dedupe — `lib/workspace/priority-engine.ts` + `lib/operational-notifications/dedupe-key.ts` reduce duplicate cards.
- **No prior unified “proposal → preview → approve → execute → re-forecast → audit” chain** in one module.

## 4. Existing explainability systems

- **`buildOperationalExplainability`** — `lib/explainability/build-operational-explainability.ts` (used from `buildOperationalAlertDto`).
- **Trust DTO** — `OperationalAttentionTrust` in actionable metadata (`why`, `whatChanged`, `recommendedNextStep`, `sourceEventType`).
- **Guidance `explain` block** — why, dataInfluences, calculations, expectedImpact, confidence (risk model confidence — not a black-box “AI score”).

## 5. Existing mutation paths (user-approved or system)

| Path | Audited by |
|------|------------|
| Goal contribution POST | `GOAL_CONTRIBUTION_RECORDED`, bucket updates |
| Goal PATCH | `GOAL_UPDATED` metadata with changed fields |
| Automation rule PATCH | Returns updated rule (no dedicated FinancialEvent in route — gap noted for action engine to add explicit audit on apply) |
| Transaction categorization / allocations | `rules-engine`, `allocation-persistence`, `FinancialEvent` variants |
| Bank sync | `BANK_SYNC_*` events |

**Safety:** No API in repo automatically moves bank money or executes transfers without user context; automation evaluates rules on transactions but allocation writes are tied to explicit rule evaluation paths.

## 6. Existing operational chaining

- **Partial chain today:** Risk → forecast/guidance → `AutomationNotification` → user opens Money Control / Cash Flow → manual fix.
- **Integrity / reconcile** — `lib/operational-state/reconcile-derived-attention.ts` auto-resolves guidance/cashflow/goal-derived rows when deterministic sources no longer emit the same `attentionKind`.
- **Missing:** Server-side **stale proposal** invalidation tied to forecast generation timestamp + **post-apply forecast diff** returned in one API response.

## 7. Duplication risks (to avoid)

- A second “rules engine” for money movement — **forbidden**; reuse `recordGoalContribution`, rule PATCH patterns, `buildCashFlowForecast`.
- Parallel recommendation store — reuse **`AutomationNotification.metadata`** for proposals keyed by `attentionKind` + `operationalActionProposal` object.
- Opaque “AI actions” — all proposal fields must be deterministic strings/ids from Prisma-backed analysis.

## 8. Missing execution workflows (gaps)

1. **Single place** to list “suggested corrective actions” distinct from narrative guidance.
2. **Explicit approval** payload (checkbox / confirm flags) before any mutating route.
3. **Before/after forecast summaries** returned from the same operational API after apply (second forecast run).
4. **Central audit event** for “user applied operational financial action X” distinct from side-effect events (e.g. contribution already logs `GOAL_CONTRIBUTION_RECORDED`).
5. **Dismiss** and **stale** lifecycle on proposal rows without orphaning the attention queue.

## 9. Recommended operational action architecture

1. **Proposal builder** — reads `buildCashFlowForecast` + `analyzeOperationalGoal` + enabled `AutomationRule` rows; emits a small capped set of typed proposals (pause allocation rule, catch-up contribution, extend goal deadline when safe).
2. **Persistence** — `ensureOperationalActionProposals(userId)` upserts `AutomationNotification` with `attentionKind: operational_action_*`, `metadata.operationalActionProposal` (`status`, `kind`, `fingerprint`, `payload`, explain).
3. **Preview** — `GET` or `POST` preview: returns **forecast summary before**; for contribution proposals includes arithmetic **bucket impact** from current Prisma state (no hidden mutation).
4. **Apply** — `POST` with `confirm` + `acknowledgedImpact`; revalidates ownership + **fingerprint** vs live forecast; executes one mutation; runs **forecast again**; writes **`OPERATIONAL_FINANCIAL_ACTION_APPLIED`** `FinancialEvent`; marks notification applied/read.
5. **Dismiss** — marks proposal dismissed without mutation.
6. **Stale** — on each ensure, if fingerprint mismatches, auto-resolve notification (read + metadata reason).

## 10. Safe implementation strategy

- **No autonomous execution** — apply route requires explicit JSON confirmation flags.
- **Cap proposals** (e.g. ≤5 per user per ensure) and only **decrease risk** classes of mutations first (pause rule, voluntary contribution, extend target date — no auto wire transfers).
- **Ownership** — every query `userId = session.user.id`; rule/goal ids verified before PATCH.
- **Idempotency** — applied notifications not re-run; fingerprint prevents stale apply.
- **Schema** — add one `FinancialEventType` enum value via migration for a clear audit line.

---

### Search targets used

`lib/guidance/**`, `lib/cashflow/**`, `lib/goals/**`, `lib/financial-automation/**`, `lib/operational-notifications/**`, `components/operational-workspace/**`, `components/operational-center/**`, `app/api/automation/rules/[id]/route.ts`, `app/api/goals/operational/**`, `prisma/schema.prisma` (`AutomationNotification`, `FinancialEvent`, `SmartAllocation`, `AutomationRule`).
