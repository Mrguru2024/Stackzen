# Persistent Operational State & Realtime Workflow — Phase 2 Architecture

Deterministic persistence and **targeted** realtime refresh on top of existing **AutomationNotification**, **FinancialEvent**, and **Prisma** — no parallel queues, no social feeds.

---

## 1. Workflow resume

| Concern | Mechanism |
|---------|-----------|
| Last Money Control context | `UserOperationalCheckpoint.payload.moneyControl` — `{ tab?, financialTransactionId? }` |
| Optional workspace focus | `payload.workspace.focusAlertId?` (informational; queue still authoritative) |
| Versioning | `payload.version = 1` for forward-compatible merges |

**API:** `GET/PATCH /api/operational-center/checkpoint` — session user only; PATCH merges partial JSON.

---

## 2. Operational lifecycle (conceptual)

| State | Implementation |
|-------|----------------|
| Active | In attention queue (`readAt` null, not snoozed/dismissed) |
| Acknowledged | `markRead` → `readAt` set |
| Snoozed | `metadata.snoozedUntil` |
| Resolved | Read, dismiss, guidance applied, or **auto-resolved** |
| Archived | *(future)* retention job; not required for MVP |

**Auto-resolve** applies only to **engine-derived** rows identified by `metadata.attentionKind` prefixes `guidance_`, `cashflow_`, and goal-planning kinds tied to `GOAL_*` types from pacing analysis — not user milestones or ad-hoc notifications.

---

## 3. Realtime synchronization

**Client hook:** `useOperationalAttentionRealtime({ userId, onOperationalChange, enabled })`

- Subscribes to `postgres_changes` on **`AutomationNotification`** and **`FinancialEvent`** with filter `userId=eq.<session user id>`.
- On INSERT/UPDATE/DELETE, **debounced** callback triggers `load()` for `/api/operational-center/alerts?ensure=true`.
- Uses shared `createBrowserClient` from `@/lib/supabaseClient` (single app pattern where possible).

**Operational requirement:** Supabase project must expose these Prisma tables to Realtime (publication) and enforce **RLS** so users only receive their rows. If subscription errors or is disabled (`NEXT_PUBLIC_ENABLE_OPERATIONAL_REALTIME=false`), UI falls back to manual refresh only — **no synthetic polling loop** masquerading as realtime.

---

## 4. Event-driven updates

| Trigger | Event |
|---------|--------|
| Engine removes a derived risk | `FinancialEventType.OPERATIONAL_ATTENTION_AUTO_RESOLVED` + metadata `{ attentionKind, reason }` |
| Existing flows | Unchanged (`GUIDANCE_ENGINE_SYNCED`, `CASHFLOW_RISK_DETECTED`, etc.) |

---

## 5. Operational memory

- **Checkpoint** row: durable resume hints.
- **FinancialEvent** stream: authoritative “what changed” for explainability and future UI.

---

## 6. Explainability (auto-resolve)

When an alert is auto-resolved:

- `metadata.autoResolvedAt`, `metadata.autoResolvedReason` (deterministic string, e.g. `guidance_key_no_longer_recommended`).
- Matching **FinancialEvent** links `relatedEntityType: AUTOMATION_NOTIFICATION` and `relatedEntityId: notification.id`.

---

## 7. Stale-state cleanup

- **Orphan derived alerts:** handled in `reconcileDerivedOperationalAttention` after ensures on the operational alerts API.
- **Checkpoint:** PATCH replaces subtrees; server does not delete checkpoint rows automatically (low cardinality).

---

## 8. Ownership & security

- All Prisma queries scoped by `session.user.id`.
- Realtime filters must match **user id** (not email) for core finance tables.

---

## 9. What we explicitly do not build

- Duplicate WebSocket servers, global event buses, or passive activity timelines.
- Auto-resolve for notifications without `attentionKind` or for non-derived types (e.g. ad-hoc invoice reminders) without a separate spec.

**Phase 2 complete.**
