# Financial Explainability & Audit Trail — Phase 2 Architecture

Deterministic, **non-LLM** transparency on top of **AutomationNotification.metadata**, **FinancialEvent**, and existing engines — no duplicate audit stores.

---

## 1. Unified payload: `OperationalExplainabilityDto`

- **`version`:** `1` (forward compatible).
- **`notificationId`:** Prisma id.
- **`attentionKind`:** optional string from metadata.
- **`lifecycle`:** derived from `readAt`, `metadata` (snooze, dismiss, guidance applied, auto-resolve).
- **`blocks`:** ordered list of typed sections (guidance, cashflow risk, goal planning, trust fallback).
- **`auditTrail`:** up to 10 `FinancialEvent` rows targeting this notification (`relatedEntityType === AUTOMATION_NOTIFICATION`, `relatedEntityId === notification.id`), newest first.

All strings in blocks must originate from **engine code** or **stored metadata**, never from generative templates.

---

## 2. Automation explainability

- **Primary source:** `FinancialEvent` (`AUTOMATION_RULE_EXECUTED` / `FAILED`) + `AutomationExecution` (future deep link from transaction UI).
- **Operational queue:** when a notification references `AUTOMATION_RULE` / execution, existing `lastFinancialEvent` + trust remain; optional future: embed `ruleId` in metadata on rule-generated alerts (out of scope unless already present).

---

## 3. Forecast explainability

- **Guidance rows:** use existing `metadata.guidance.inputsUsed`, `calculations`, `confidence`, `expectedImpact`, `riskCode`.
- **Cashflow rows:** `metadata.cashflowRisk` — `code`, `confidence`, `summary`, `detail` (mirrors `RiskFindingDto`).

---

## 4. Guidance explainability

Rendered as a **guidance_engine** block from `metadata.guidance` + `guidanceEngineVersion`.

---

## 5. Goal explainability

**goal_planning** block from `metadata.goalPlanning` — `findingCode`, `reasoningLines[]` (from `GoalAnalysisFinding.explain`).

---

## 6. Alert lifecycle explainability

| User-visible state | Signals |
|--------------------|---------|
| active | in attention queue |
| acknowledged | `readAt` set |
| suppressed | snooze or dismiss |
| resolved | dismissed, guidance applied, auto-resolved, or read + domain rules |

Expose ISO timestamps: `autoResolvedAt`, `autoResolvedReason`, `snoozedUntil`, `dismissedAt`, `guidanceAppliedAt`.

---

## 7. User-facing audit trails

- **Card-level:** collapsible “Operational audit trail” on each alert.
- **API:** same data embedded in `GET /api/operational-center/alerts` to avoid N+1 and fake realtime.

---

## 8. Ownership & security

- Events and notifications already scoped by `userId` in route queries.
- No cross-user ids in DTOs.

---

## 9. Future AI enrichment

- Optional later: AI may **annotate** with `metadata.aiSummary` under feature flag; core blocks remain authoritative.

---

*Phase 2 complete.*
