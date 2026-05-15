# Adaptive Operational Onboarding — Phase 1 Audit

## 1. Existing onboarding systems

| Surface | Location | Behavior |
|---------|----------|----------|
| **Income profile gate** | `app/(auth)/onboarding/page.tsx` → `components/OnboardingFlow` | Multi-select income types; persists via `PUT /api/income-profiles`; redirects to `/dashboard`. **Directly tied** to `UserIncomeProfile` and activation map. |
| **Legacy questionnaire** | `components/OnboardingQuestionnaire`, `EnhancedOnboarding` | Multi-step client state; posts to `/api/onboarding` or `/api/onboarding/enhanced`; wellness / `UserSettings.customData`. **Parallel** to operational-first flow; risk of cognitive overload if both surfaced. |
| **API onboarding** | `app/api/onboarding/route.ts`, `enhanced/route.ts` | Writes `UserSettings`, `Income`, wellness-style aggregates. **Not** wired to operational workspace by default. |
| **Stripe Connect** | `app/api/stripe/connect/onboard`, return pages | Legitimate external onboarding for payouts — separate domain. |

## 2. Existing activation systems

| System | Location | Role |
|--------|----------|------|
| **Income profile activation** | `lib/income-profiles/activation.ts`, `GET /api/income-profiles/activation` | Merges `ActivationFeatureKey`, nav/workflow/widget keys from active `UserIncomeProfile` rows; always merges finance operational nav keys (`operational-center`, `cash-flow`, `money-control`, `goals/operational`). |
| **Operational checkpoint** | `UserOperationalCheckpoint.payload` JSON, `lib/operational-state/checkpoint-payload.ts`, `PATCH /api/operational-center/checkpoint` | Resumable Money Control (`tab`, `financialTransactionId`) and workspace `focusAlertId`. **Single-row per user** — correct place to extend **non-duplicative** UX state (dismissals, milestone ack). |
| **Operational alerts** | `GET /api/operational-center/alerts`, ensure + reconcile pipeline | Real operational attention queue (`AutomationNotification`) + `FinancialEvent` correlation. |
| **Workspace UI** | `components/operational-workspace/UnifiedOperationalWorkspace` | Loads alerts, activation summary, checkpoint; `buildAdaptiveShortcuts` from profiles; workflow continuity strip; realtime refresh hook. |

## 3. Existing first-session workflows

- Sign-up → optional redirect to `/onboarding` (auth/middleware dependent) → income profiles saved → dashboard.
- **Money Control** empty state copy references bank sync and ledger (`components/money-control`).
- **Operations hub** lists prioritized alerts and deep links to `/money-control`, `/cash-flow`, `/goals/operational`, `/financial-timeline`.

## 4. Cognitive overload risks

- **Parallel onboarding UIs** (questionnaire vs income-only flow) if both linked from marketing or legacy routes.
- **Large activation feature sets** for multi-profile users (`resolveIncomeProfileActivation` unions all features).
- **Operations hub + Money Control + Cash flow** all surface risks/goals without a single **ordered** “next best action” (partially mitigated by ranked alerts).
- **UserOnboardingData** model exists in Prisma but is **not** clearly the driver of post-auth operational UX — risk of stale duplicate “profile questionnaire” state if revived without coordination.

## 5. Existing progressive disclosure systems

- **Income-profile-driven shortcuts** in `UnifiedOperationalWorkspace` (`buildAdaptiveShortcuts`) — contractor-like profiles add invoices/jobs before core money loops.
- **Nav gating** via `resolveIncomeProfileActivation` (navKeys) — used by shell/navigation patterns elsewhere in app (verify per layout).
- No unified **tier counter** persisted for “unlock level 2 forecasting” beyond feature flags in activation map.

## 6. Existing operational dead ends

- User completes income onboarding but **never** connects bank → ledger empty; Money Control explains but **no single CTA** from operations hub to bank link if that route is buried in settings.
- User has transactions but **never** opens cash flow → forecast risks never felt; guidance may still appear via alerts if ensure runs elsewhere.
- **Checkpoint** only stores Money Control + focus alert — no explicit “activation checklist” until this build.

## 7. Duplication risks

- Adding a **second** per-user JSON store for onboarding (e.g. new Prisma model) would duplicate `UserOperationalCheckpoint` and `UserIncomeProfile`.
- Duplicating **activation** logic client-side vs server-side — must stay server-derived with optional dismiss overlay in checkpoint only.

## 8. Missing onboarding workflows (gaps)

- **Deterministic readiness** from Prisma (bank, ledger, categorization, rules/buckets, forecast engagement, goals, attention engagement) not exposed as one API.
- **Explicit milestone audit** (`FinancialEvent`) for operational activation not present.
- **User-dismissed contextual hints** (NBA) without mutating underlying operational truth.
- **Progressive tier** (0–3) not computed from real usage signals.

## 9. Recommended activation architecture

- **Derive** step completion from canonical tables (`UserIncomeProfile`, `BankConnection`, `FinancialTransaction`, `AutomationNotification`, `FinancialEvent`, `OperationalGoal`, `SmartBucket` / `SmartAllocation`).
- **Persist** only dismissals and “milestone event already emitted” keys inside `UserOperationalCheckpoint.payload.activation` (extend Zod merge).
- **Expose** `GET /api/operational-center/adaptive-activation` for workspace + dashboards.
- **Record** `FinancialEventType.OPERATIONAL_ACTIVATION_MILESTONE` via explicit `POST` so there are **no silent** audit writes on passive page views.

## 10. Safe implementation strategy

- Extend `operationalCheckpointPatchSchema` + `mergeOperationalCheckpoint` for `activation` object (array merge rules).
- Add small `lib/operational-activation/*` module (pure derivation + NBA builder).
- Embed **OperationalActivationPanel** in `UnifiedOperationalWorkspace` only (contextual, not a passive tour).
- Run Prisma migrate for one new `FinancialEventType` value.
- Validate with `prisma validate`, `generate`, `npm run typecheck`, targeted Jest for merge + tier helper.

### Files reviewed (representative)

- `app/(auth)/onboarding/page.tsx`, `components/OnboardingFlow/index.tsx`
- `app/api/onboarding/route.ts`, `app/api/onboarding/enhanced/route.ts`
- `app/api/income-profiles/route.ts`, `app/api/income-profiles/activation/route.ts`
- `lib/income-profiles/activation.ts`
- `components/operational-workspace/UnifiedOperationalWorkspace/index.tsx`
- `app/api/operational-center/checkpoint/route.ts`, `lib/operational-state/checkpoint-payload.ts`
- `app/api/operational-center/alerts/route.ts`
- `prisma/schema.prisma` — `UserOnboardingData`, `UserOperationalCheckpoint`, `FinancialEvent`, `UserIncomeProfile`
