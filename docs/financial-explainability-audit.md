# Financial Explainability & Audit Trail — Phase 1 Audit

**Scope:** Map deterministic reasoning, metadata, and event trails before extending transparency. **Date:** 2026-05-09

---

## 1. Existing explainability systems

| Area | Mechanism | Traceability |
|------|-----------|--------------|
| **Guidance recommendations** | `AutomationNotification.metadata.guidance` — `kind`, `priority`, `riskCode`, `inputsUsed`, `calculations[]`, `expectedImpact`, `confidence`; plus `trust` from `buildOperationalAttentionMetadata`. | Strong — engine-authored strings and forecast snapshot fields. |
| **Cash flow risk alerts** | `ensureCashflowAttentionNotifications` — `trust.why` = risk `summary`; body = `detail`. Metadata historically **lacked** structured risk code in JSON (only `attentionKind`). | Medium — narrative in body; risk code lives in sibling `FinancialEvent` on create only. |
| **Goal planning alerts** | `ensure-goal-attention` — `trust.why` = `f.explain.join(' ')`. | Medium — reasoning collapsed into one string; `findingCode` not in metadata. |
| **Auto-resolved alerts** | `reconcile-derived-attention` — `metadata.autoResolvedAt`, `autoResolvedReason`; `FinancialEventType.OPERATIONAL_ATTENTION_AUTO_RESOLVED` with `{ attentionKind, reason }`. | Strong for resolution path. |
| **Goal contributions / milestones** | `FinancialEvent` + notification `trust` via `buildOperationalAttentionMetadata`. | Strong for money movement. |
| **Automation rule execution** | `FinancialEventType.AUTOMATION_RULE_EXECUTED` / `FAILED` with `metadata.transactionId`, `ruleType`, `allocationPersisted`; `AutomationExecution` rows with snapshots. | Strong in DB; **not** surfaced on operational cards unless linked entity matches correlation. |
| **Operational cards UI** | `OperationalTrustDto` — Why / What changed / Recommended next step; optional `lastFinancialEvent` snippet. | Good baseline; **no** structured drill-down for calculations, lifecycle, or event list per notification. |

---

## 2. Existing audit/event systems

- **`FinancialEvent`** — append-only; `type`, `source`, `relatedEntityType` / `relatedEntityId`, `metadata` JSON. Central audit spine.
- **`createFinancialEventSafe`** — non-throwing writer; failures only logged.
- **Correlation** — `correlateLatestFinancialEvents` maps latest event per `entityType:entityId` for trust fallback (e.g. category/percent heuristics in `coerceTrust`).
- **No** dedicated “explainability” table — correct; avoid duplication.

---

## 3. Existing operational metadata

- **Versioned attention envelope** — `metadata.version`, `attentionKind`, `actions[]`, `trust`.
- **Guidance** — `guidanceEngineVersion`, nested `guidance` object (rich).
- **Snooze/dismiss/guidance applied** — timestamps in `metadata` JSON (`snoozedUntil`, `dismissedAt`, `guidanceAppliedAt`).

---

## 4. Existing workflow traceability

- **Actions** — typed `AutomationClientAction` deep links (transactions, invoices, goals, cash flow).
- **Related entity** — `relatedEntityType` / `relatedEntityId` on notifications for correlation.
- **Gaps** — invoice/job-specific alerts may rely on body text; automation executions not aggregated per operational card without entity match.

---

## 5. Existing explanation gaps

| Gap | Impact |
|-----|--------|
| Cashflow cards lack structured **riskCode / confidence** in notification metadata (vs event-only). | UI cannot show compact “forecast trace” without re-parsing body. |
| Goal cards lack structured **findingCode** and **reasoning lines** in metadata. | Hard to render bullet-level audit. |
| No **per-notification FinancialEvent list** in API/UI. | User cannot see “resolve” events next to alert without global event UI. |
| `coerceTrust` fallbacks can read **generic** copy when `trust` missing. | Acceptable for legacy rows; should not expand into faux-AI prose. |
| **Automation → alert** linkage | Execution trace lives on rule + transaction, not always on notification. |

---

## 6. Duplication risks (to avoid)

- Parallel “Explanation” or “AuditLog” Prisma models → **rejected**.
- LLM-generated summaries for core flows → **rejected** (policy: deterministic only).
- Separate WebSocket “explanation feed” → **rejected**; use existing data paths.

---

## 7. Missing trust/transparency workflows

- Unified **client DTO** for structured blocks (guidance / cashflow / goal) + **lifecycle** + **audit trail**.
- **Drill-down UI** (collapsible) on operational cards for calculations, inputs, and linked events.
- Optional **forecast assumption** surfacing for cashflow (align with `CashFlowForecastResponseDto.explain` when stored on guidance rows only today).

---

## 8. Recommended explainability architecture

1. **Single DTO** `OperationalExplainabilityDto` (versioned) attached to `OperationalAlertDto`, built server-side from `AutomationNotification` + `metadata` + indexed `FinancialEvent` rows where `relatedEntityType === AUTOMATION_NOTIFICATION`.
2. **Extend** cashflow + goal notification metadata with small structured fields (`cashflowRisk`, `goalPlanning`) alongside existing `trust` — no schema migration.
3. **Reuse** `FinancialEvent` as the only audit store; render last N events per notification from existing `recentEvents` query in operational alerts route.
4. **UI** — `<details>` audit sections: Lifecycle, Structured blocks, Event trail (types + ISO timestamps + raw metadata for power users).

---

## 9. Safe implementation strategy

1. Add `lib/explainability/*` pure builders + unit tests (fixtures from real metadata shapes).
2. Extend `buildOperationalAlertDto` + alerts `GET` route to pass audit slices and emit `explainability`.
3. Enrich cashflow/goal metadata writers with structured fields (backward compatible).
4. Update `OperationalAlertCards` + stories/tests; fix any small bugs found (e.g. action label handler).
5. Run `prisma validate`, `npm run typecheck`; `prisma generate` where environment allows.

---

*Phase 1 complete — proceed to architecture + implementation.*
