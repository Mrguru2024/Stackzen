# Persistent Operational State & Realtime Workflow — completion report

Phases 1–5 for **deterministic operational persistence**, **auto-resolution of stale derived alerts**, **checkpointed workflow resume**, and **optional Supabase Realtime** refresh — without a second attention queue or social-style activity feeds.

---

## 1. Files audited (Phase 1)

Captured in `docs/persistent-operational-state-audit.md`: Operational Workspace, `AutomationNotification` lifecycle, `FinancialEvent`, ensure/reconcile gaps, Money Control review flows, legacy Smart Saving realtime hooks, and stale derived-alert risk.

---

## 2. Files changed or added

| Area | Path |
|------|------|
| Docs | `docs/persistent-operational-state-audit.md`, `docs/persistent-operational-state-architecture.md`, this report |
| Schema | `prisma/schema.prisma` — `UserOperationalCheckpoint`, `FinancialEventType.OPERATIONAL_ATTENTION_AUTO_RESOLVED`, `User.operationalCheckpoint` |
| Migration | `prisma/migrations/20260510160000_persistent_operational_state/migration.sql` |
| Reconcile | `lib/operational-state/reconcile-derived-attention.ts` |
| Checkpoint | `lib/operational-state/checkpoint-payload.ts`, `app/api/operational-center/checkpoint/route.ts` |
| Alerts API | `app/api/operational-center/alerts/route.ts` — calls reconcile after ensures |
| Realtime | `hooks/useOperationalAttentionRealtime.ts` |
| Workspace UI | `components/operational-workspace/UnifiedOperationalWorkspace/index.tsx` — checkpoint fetch, resume card, realtime hook |
| Money Control | `components/money-control/index.tsx` — debounced checkpoint PATCH for tab + selected txn |
| Goals | `lib/goals/ensure-goal-attention.ts` — export `fullGoalAttentionKind` for reconcile alignment |
| Tests | `lib/operational-state/__tests__/checkpoint-payload.test.ts`, `UnifiedOperationalWorkspace.test.tsx` mocks |

---

## 3. Systems reused

- **AutomationNotification** — canonical queue; auto-resolve sets `readAt` + explainability metadata.
- **FinancialEvent** — `OPERATIONAL_ATTENTION_AUTO_RESOLVED` for audit trail.
- **Existing ensure pipelines** — unchanged ordering; reconcile runs **after** all ensures on `GET .../alerts?ensure=true`.
- **Supabase** — shared `createBrowserClient` (`lib/supabaseClient.ts`); **user id** filters (not email) for Prisma tables.

---

## 4. Duplicate systems avoided

- No parallel workflow tables beyond a **single** `UserOperationalCheckpoint` row per user (resume hints only).
- No new WebSocket server; no generic event bus.
- Realtime is **narrow**: notifications + financial event inserts for queue refresh.

---

## 5. Realtime synchronization status

| Item | Status |
|------|--------|
| Client hook | **Shipped** — debounced refetch of operational data |
| Supabase publication / RLS | **Ops task** — enable `AutomationNotification` and `FinancialEvent` in Realtime with row-level security matching `userId` |
| Disable switch | `NEXT_PUBLIC_ENABLE_OPERATIONAL_REALTIME=false` turns subscriptions off (manual refresh only) |

---

## 6. Workflow persistence status

| Item | Status |
|------|--------|
| Checkpoint API | **Shipped** — `GET/PATCH /api/operational-center/checkpoint` |
| Money Control persistence | **Shipped** — tab + `financialTransactionId` when on Review |
| Resume CTA | **Shipped** on Operations hub when checkpoint has txn id |

---

## 7. Lifecycle / auto-resolution status

| Item | Status |
|------|--------|
| Derived orphan cleanup | **Shipped** — `guidance_*`, `cashflow_*`, goal-planning `GOAL_*` notifications with `attentionKind` |
| Snoozed / dismissed | **Skipped** for auto-resolve (respects user intent) |
| Explainability | **Shipped** — `metadata.autoResolvedReason`, `FinancialEvent` payload |

---

## 8. Validation results (Phase 4)

| Command | Result (2026-05-09) |
|---------|---------------------|
| `npx prisma validate` | **Passed** |
| `npx prisma generate` | **Failed** on Windows agent with `EPERM` on `query_engine-windows.dll.node` (retry after closing locking processes / run in CI on Linux) |
| `npm run typecheck` | **Passed** |
| Jest (targeted) | **Passed** — `checkpoint-payload.test.ts`, `UnifiedOperationalWorkspace.test.tsx` |

---

## 9. Remaining production gaps

1. **Apply migration** on all environments: `prisma migrate deploy` (or equivalent).
2. **Supabase Realtime** — add tables to publication; verify RLS policies for `userId` column names on `AutomationNotification` / `FinancialEvent`.
3. **Performance** — `reconcileDerivedOperationalAttention` re-runs guidance + forecast + per-goal analysis on each ensured alerts fetch; acceptable for MVP, tune with shared snapshot if hot.
4. **Broader auto-resolve** — e.g. transaction-linked alerts when metadata encodes `financialTransactionId` but not `attentionKind`; not in this pass.
5. **Checkpoint schema** — optional `workspace.focusAlertId` PATCH from UI not wired yet.

---

## 10. Production readiness assessment

**Ready for staged rollout** after DB migration and (optional) Realtime configuration. Core behavior is **deterministic** and **auditable**; live refresh is **best-effort** and degrades to manual refresh.

---

*Delivery completed 2026-05-09.*
