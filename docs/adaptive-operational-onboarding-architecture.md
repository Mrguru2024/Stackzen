# Adaptive Operational Onboarding — Architecture

## Goals

Contextual **operational activation**: every surfaced step links to a **real route** (Money Control, Cash Flow, Goals, Onboarding, Operations hub). No passive slide decks. No duplicate onboarding state outside `UserOperationalCheckpoint` + canonical Prisma entities.

## Data sources

| Signal | Source |
|--------|--------|
| Income profile chosen | ≥1 active `UserIncomeProfile` |
| Bank linked | ≥1 `BankConnection` with `status = ACTIVE` |
| Ledger populated | ≥1 `FinancialTransaction` for user |
| Categorization momentum | ≥3 `FinancialTransaction` with `categoryId` set |
| Envelopes / automation | ≥1 enabled `AutomationRule` **or** ≥1 `SmartAllocation` |
| Forecast engaged | ≥1 `FinancialEvent` of type `CASHFLOW_FORECAST_GENERATED` or `CASHFLOW_RISK_DETECTED` |
| Goal created | ≥1 `OperationalGoal` |
| Attention engaged | ≥1 `AutomationNotification` with `readAt` not null (metadata-based “applied” detection can be added later with a safe JSON filter) |

## Progressive tiers

Computed in `computeProgressiveTier` from **count of completed steps** (not from fake gamification):

| Tier | Meaning |
|------|---------|
| 0 | Foundations only (profile + bank + ledger) |
| 1 | Core money loop (categorize + envelopes/rules) |
| 2 | Planning loop (forecast + goals) |
| 3 | Full operational surface (attention engaged + tier 2) |

Tier drives **which optional shortcuts** appear in the activation panel (advanced automation / analytics links), not global app lockout — income activation map remains authoritative for nav.

## Next best actions (NBA)

Ordered list of **first incomplete** steps with:

- `key` — stable string for dismiss + milestone emission
- `title`, `body`
- `href` — App Router path with query where useful
- `priority` — number (lower = sooner)

Dismissal: client sends `PATCH /api/operational-center/checkpoint` with `activation.dismissedNbaKeys: [key]`; server **merges uniquely** with existing keys.

## Persistence

`UserOperationalCheckpoint.payload` shape (strict patch):

```json
{
  "version": 1,
  "activation": {
    "dismissedNbaKeys": ["…"],
    "milestoneEventsEmitted": ["income_profile_selected", "…"]
  }
}
```

- `dismissedNbaKeys`: user explicitly hid an NBA card (does not mark workflows “complete”).
- `milestoneEventsEmitted`: prevents duplicate `FinancialEvent` rows for the same step.

## Financial events

- New enum: `FinancialEventType.OPERATIONAL_ACTIVATION_MILESTONE`.
- **POST** `/api/operational-center/adaptive-activation/record-milestones` (authenticated) compares completed steps vs `milestoneEventsEmitted`; for each newly completed step, writes one `FinancialEvent` and appends the key via checkpoint merge.
- **GET** adaptive activation is **read-only**.

## HTTP API

### `GET /api/operational-center/adaptive-activation`

Returns:

- `derivedSteps` — booleans + short evidence counts where helpful
- `progressiveTier`
- `nextActions` — filtered by `dismissedNbaKeys`
- `checkpointActivation` — echo of stored activation slice (for client merge UX)

### `POST /api/operational-center/adaptive-activation/record-milestones`

Idempotent: only emits events for steps that are **done** and **not** already listed in `milestoneEventsEmitted`.

## UI

`OperationalActivationPanel` (client) embedded in `UnifiedOperationalWorkspace`:

- Readiness checklist (compact, derived).
- Top next actions as links/buttons.
- “Dismiss suggestion” per NBA (PATCH checkpoint).
- Optional “Record milestones to audit log” button → POST record-milestones (trust / compliance friendly).

## Ownership & security

All routes use `requireAuthSession`; all Prisma queries scoped by `session.user.id`.

## Future AI enrichment

NBA list and copy are structured DTOs (`key`, `body`, `evidence`) so a future model can **rephrase** explanations without changing completion logic.
