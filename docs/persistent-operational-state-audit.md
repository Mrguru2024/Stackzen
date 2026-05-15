# Persistent Operational State & Realtime Workflow — Phase 1 Audit

**Scope:** Map existing operational persistence, notification lifecycle, events, refresh patterns, and duplication risks before adding orchestration. **Date:** 2026-05-09

---

## 1. Existing operational state systems

| System | Persistence | Role |
|--------|-------------|------|
| **AutomationNotification** | Prisma row per alert | Canonical in-app attention queue; `readAt`, `metadata` (snooze, dismiss, `attentionKind`, actions, trust). |
| **FinancialEvent** | Append-only ledger | Audit trail: guidance sync, cashflow risk, goal risk, contributions, automation outcomes. |
| **Operational DTOs** | Ephemeral (API) | `buildOperationalAlertDto` + `correlateLatestFinancialEvents` enrich cards; no client-side store. |
| **Unified Operational Workspace** | Client `useState` | `GET /api/operational-center/alerts?ensure=true` on mount + manual **Refresh queue**; no subscription. |
| **Transaction review** | `FinancialTransaction` + metadata | Corrections via `PATCH /api/automation/transactions/:id`; deep links `?tab=review&txnId=`. |
| **Goal / cashflow / guidance** | Derived alerts | `ensure*AttentionNotifications` upsert by `attentionKind`; **orphan rows** if risk disappears (gap). |
| **UserOperationalCheckpoint** | *(added in Phase 3)* | Single JSON checkpoint per user for resume (not a second queue). |

---

## 2. Existing realtime infrastructure

| Location | Behavior |
|----------|----------|
| `hooks/useSupabaseRealtime.ts` | `postgres_changes` on **legacy** tables (`savings_rules`, `smart_buckets`, …) with `user_id=eq.${email}` — **parallel** to Prisma naming (`userId` on core finance models). |
| **Operational / Prisma tables** | **No** existing `postgres_changes` subscription for `AutomationNotification` or `FinancialEvent`. |
| **Workspace** | Pull-only; risk of stale UI until user refreshes or navigates away and back. |

---

## 3. Existing workflow continuation systems

- **OperationalAlertCards** — `onMutate` refetches after PATCH / actions.
- **Workflow continuity** card — static links (Money Control → Cash Flow); no persisted “step 2 in progress”.
- **URL state** — `txnId`, `tab` on Money Control for deep links from alerts.

---

## 4. Existing lifecycle handling

- **PATCH `/api/automation/notifications/[id]`** — `markRead`, `snoozeHours` → `metadata.snoozedUntil`, `dismiss` → `metadata.dismissedAt`, `guidanceApplied` → `metadata.guidanceAppliedAt`.
- **Attention queue** — `isInAttentionQueue` = unread and not snoozed/dismissed (`lib/operational-notifications/helpers.ts`).
- **Derived ensures** — guidance/cashflow/goals **update or create** matching `attentionKind`; **do not remove** stale kinds when risks clear.

---

## 5. Existing stale-state risks

| Risk | Detail |
|------|--------|
| **Orphan derived alerts** | Guidance/cashflow/goal notifications remain active when underlying forecast/analysis no longer emits that finding. |
| **Client stale queue** | Workspace holds snapshot until manual refresh. |
| **Dual realtime patterns** | Smart Saving uses Supabase + email filter; core ops use Prisma API only — inconsistent, not duplicated state, but integration hazard if extended naively. |

---

## 6. Existing notification lifecycle gaps

- No **automatic** transition to “resolved” when deterministic engine removes a risk.
- No **FinancialEvent** explaining “why this alert cleared” for auto-resolution (until Phase 3).
- Snooze/dismiss stored in JSON; **no** formal enum lifecycle column (acceptable; metadata is source of truth).

---

## 7. Duplication risks (to avoid)

- Second attention table or parallel “workflow queue” → **rejected**; extend `AutomationNotification` + checkpoint JSON only.
- New global WebSocket server → **rejected**; Supabase Realtime **only** if table publication + RLS align.
- Social/activity feed UI → **out of scope**.

---

## 8. Missing persistence workflows (pre–Phase 3)

- Resumable **checkpoint** (last Money Control tab / focused txn / optional alert id).
- **Server-side** orphan cleanup for derived `attentionKind` rows.
- **Event-backed** explainability when auto-resolved.

---

## 9. Recommended source-of-truth architecture

1. **Attention** — `AutomationNotification` remains canonical.
2. **Explainability** — `FinancialEvent` for sync + auto-resolve outcomes.
3. **Resume** — `UserOperationalCheckpoint.payload` (versioned JSON) per user.
4. **Live refresh** — Supabase `postgres_changes` on `AutomationNotification` + `FinancialEvent` filtered by `userId`, **plus** debounced refetch of `/api/operational-center/alerts`; fallback remains manual refresh if Realtime unavailable.
5. **Auto-resolve** — After `ensure*` pipeline, compute expected `attentionKind` sets; mark unread, non-snoozed, non-dismissed orphans as read with metadata `autoResolvedAt` / `autoResolvedReason`.

---

## 10. Safe implementation strategy

1. Add Prisma model + enum value for events; migrate.
2. Implement `reconcileDerivedOperationalAttention` (pure Prisma + existing engines); call from `alerts` GET after ensures.
3. Add checkpoint GET/PATCH API with strict `userId` ownership.
4. Add `useOperationalAttentionRealtime` using **session user id** (not email) and Prisma table names; document Supabase publication/RLS requirements.
5. Wire **UnifiedOperationalWorkspace** to hook + optional resume CTA from checkpoint.
6. Avoid touching legacy Smart Saving realtime hooks except to reference them in docs.

**Phase 1 complete — implementation follows architecture doc.**
