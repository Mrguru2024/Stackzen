# External Financial Execution & Operational Integrations — Phase 1 Audit

**Date:** 2026-05-13  
**References:** `docs/unified-operational-command-center-architecture.md`, `docs/unified-operational-command-center-completion-report.md`  
**Rule:** No autonomous money movement; no hidden execution; approval-based operational actions only; Prisma + `FinancialTransaction` + `FinancialEvent` + `AutomationNotification` remain canonical.

---

## 1. Existing execution workflows

| Workflow | Mechanism | Ownership / audit |
|----------|-----------|-------------------|
| **Operational financial actions** | `POST .../operational-actions/:id/preview` → user confirms → `POST .../apply` with `confirm` + `acknowledgedImpact` | `applyOperationalFinancialAction` writes `FinancialEvent` (`OPERATIONAL_FINANCIAL_ACTION_APPLIED`), updates `AutomationNotification.metadata` proposal status |
| **Pause rule / shift bill / goal contribution / extend goal / prepare reserve** | Encoded in proposal `kind` + payload; apply path switches on kind | Same event pipeline; fingerprint staleness blocks silent drift |
| **Money Control ledger review** | `/money-control?tab=review` + optional `txnId` | Transaction-level categorization and allocation edits on `FinancialTransaction` |
| **Money Control rules / buckets** | `/money-control?tab=rules`, `tab=buckets` | Allocation automation; ties to reserve intelligence guidance |
| **Cash flow forecast** | `/cash-flow` — deterministic projection | Consumed by reserve, timing, contractor bundle builders |
| **Timing calendar shifts** | `/operational-center/calendar` — drag/drop creates **proposals** only | User-approved apply via operational-actions API |
| **Invoices / receivables** | `/invoices`, `/invoices/[id]` — list + detail; Stripe payment intents for hosted pay | Contractor snapshot reads open AR; `PAY_INVOICE` client action routes to invoice detail (no secret pay URL in cards) |
| **Jobs** | `/jobs/[id]` | Contractor job cash snapshot inputs |
| **Bank sync** | `POST /api/bank/sync` from Connected panel | Ingests into ledger; `FinancialTransaction` canonical |
| **Goals operational** | `/goals/operational` (+ optional `goalId`) | Goal contributions and pacing linked to operational actions |
| **Attention queue triage** | `OperationalAlertCards` — read/dismiss/snooze + structured `actions[]` | `AutomationNotification` + ranking/dedupe |
| **Command center primary CTA** | Deterministic ladder → external routes + hub anchors | Read-only composition; links documented in command center architecture |

---

## 2. Existing integration systems

| System | Role |
|--------|------|
| **Plaid (bank)** | Link token, exchange token, sync, transactions APIs under `app/api/bank/**` |
| **Stripe (invoices)** | Payment intents, verify payment, hosted flows under `app/api/invoices/**` |
| **Operational hub APIs** | `app/api/operational-center/**` — alerts, checkpoint, connectivity, workflow-resolution, operational-actions, timing snapshots |
| **Income / activation** | `/api/income-profiles/activation` — workspace adaptive shortcuts |
| **Next.js App Router** | Dashboard routes under `app/(dashboard)/**` |

No separate “integration bus”; execution stays **in-app** with explicit APIs and session-scoped `requireAuthSession` patterns on mutating routes.

---

## 3. Existing operational handoff systems

| Handoff | Today |
|---------|--------|
| **Alert → deep link** | `OperationalAlertCards` `resolveActionHref` maps `AutomationClientAction` → Money Control, invoices, jobs, clients, cash flow, goals |
| **Checkpoint → Money Control** | `/api/operational-center/checkpoint` + workspace “Resume ledger review” card with `txnId` |
| **Command center → routes** | Primary CTA + subsystem `href` rows (reserve → rules, timing → calendar, contractor → invoices, workflow → attention anchor) |
| **Panel footers** | Reserve / timing / workflow / contractor panels link to Money Control, cash flow, goals, operations hub, calendar — **ad hoc**, no shared context query |
| **Workflow resolution → hub** | `oldestPendingHref` when proposal id exists points to `#workflow-resolution` (see risks) |

---

## 4. Existing deep-link workflows

- **Money Control:** `?tab=review|rules|buckets`, `txnId` for single-transaction focus.
- **Operational goals:** `?goalId=`.
- **Invoices:** `/invoices/[invoiceId]` for detail.
- **Hub anchors:** `#operational-actions`, `#operational-attention`, `#workflow-resolution`.
- **Command center:** `#operational-command-center` on the summary card.

---

## 5. Existing explainability systems

- **Per-alert:** `OperationalExplainabilityDto`, trust blocks on actionable notifications.
- **Panel snapshots:** `explain.assumptions` / `explain.inputsUsed` on reserve, timing, contractor, workflow DTOs.
- **Operational action preview:** Deterministic `notes[]` + forecast summary before/after path in apply.
- **Command center:** `explain.assumptions`, `explain.contributors`, subsystem `inputsUsed`, `primaryCta.reason`.

**Gap:** Target routes (Money Control, cash flow, invoices, calendar) do **not** read a shared “why am I here” query, so **operational context is lost on navigation** unless the user remembers the card they clicked.

---

## 6. Duplication / friction risks

| Risk | Evidence | Impact |
|------|----------|--------|
| **Context loss on drill-through** | Command center + panels use plain `href`s | User lands on Money Control / invoices / calendar **without** explicit continuation of escalation source |
| **Duplicate narrative** | Multiple panels each explain pressure (mitigated by `compactIntelligencePanels` + command center) | Residual cognitive load on long pages |
| **Misaligned workflow deep link** | `WorkflowResolutionPanel` `oldestPendingHref` uses `#workflow-resolution` when `oldestPendingProposalNotificationId` is set | Pending **operational proposals** live under **Operational financial actions** (`#operational-actions`); link may send user to wrong scroll target |
| **Forecast cost** | Hub bundles once; panels still refetch own APIs | Latency (documented in command center completion report) |
| **Integration drift** | New action types must update `resolveActionHref`, preview, apply, ensure-proposals in parallel | Maintenance burden; no single “execution registry” file |

---

## 7. Missing execution workflows (gaps)

1. **Deterministic URL (or equivalent) handoff** from command center / panels to execution surfaces — preserve `source`, `subsystem`, `band`, and CTA ladder step where applicable.
2. **Target-page continuity banner** — short, deterministic copy: why the user arrived, what improves after completion, what risk is reduced (no LLM prose).
3. **Single serialization/parser** for handoff params — avoid each panel inventing different query keys.
4. **Workflow panel anchor fix** — oldest pending proposal → `#operational-actions` (and optional future `?proposal=` out of scope unless already supported).

---

## 8. Recommended operational architecture

1. **`lib/operational-execution-context`** — Pure helpers: whitelist query keys (`op_src`, `op_sub`, `op_band`, `op_step`), `appendToHref`, `parseFromSearchParams`, deterministic `explainExecutionHandoff` strings.
2. **Command center DTO extension** — `continuation.executionHandoff` with `source: 'command_center'`, `ctaLadderStep`, optional `subsystem` / `band` for primary CTA focus.
3. **UI** — `OperationalCommandCenterCard` appends handoff query to primary CTA + subsystem “Open related view” links; optional later: panel footers use same helper.
4. **Banner** — Small client banner on Money Control, cash flow, invoices list, timing calendar when valid `op_*` params present; dismissible; no new routes.

---

## 9. Safe implementation strategy

1. Ship **read-only query parameters + banner + command center link hardening** first — no new Prisma fields, no background execution.
2. Keep **apply/preview/sync** unchanged; only improve **discoverability and continuity**.
3. Add **unit tests** for serialize/parse and ladder step mapping.
4. **Fix** workflow resolution `oldestPendingHref` to align with operational actions anchor.
5. Defer **alert-level handoff** (appending `op_*` inside `OperationalAlertCards`) to a follow-up PR to limit scope and retest all action types.

### Update (v1 shipped)

Execution handoff query contract, command center wiring, continuity banner on key execution routes, `/invoices` redirect query preservation, and workflow oldest-proposal anchor alignment are implemented per `docs/external-financial-execution-architecture.md` §10.

## Audit conclusion

StackZen already has **strong approval-gated execution** (operational actions, Money Control, invoices, bank sync) with **solid audit** (`FinancialEvent`, notification metadata). The main gap for “external financial execution infrastructure” is **operational continuity across navigation** — deterministic handoff parameters and target-page explainability — not new integrations or autonomous runners.
