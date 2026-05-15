# Income Profile Architecture Audit

## 1) Existing reusable systems

- **Auth/session source of truth**
  - NextAuth session and callbacks in `lib/auth-config.ts`
  - Ownership guards via `requireAuthSession` and `getServerSession`
- **Canonical ORM/data layer**
  - Prisma schema in `prisma/schema.prisma`
  - Existing financial entities already in place: `Income`, `Client`, `Job`, `Quote`, `Invoice`, `LineItem`, `Expense`, `SavingsGoal`, `FinancialGoal`, `UserSettings`, `UserOnboardingData`
- **Onboarding entrypoint**
  - `/onboarding` route (`app/(auth)/onboarding/page.tsx`) already exists and points to `components/OnboardingFlow`
- **Navigation + layout reuse points**
  - Main nav config in `config/nav-links.ts`
  - Active sidebar implementation in `components/sidebar.tsx`
  - Dashboard layout shell in `app/(dashboard)/layout.tsx`
- **Preferences/profile persistence**
  - `app/api/settings/route.ts` + `UserSettings` model for user-level preferences
- **Feature/rule adaptation primitives**
  - Trial/tier checks in middleware/trial utilities
  - Role-aware “view as” provider in `components/providers/ViewAsProvider.tsx`

## 2) Existing conflicting systems

- **Duplicate onboarding implementations** (placeholder + multiple alternate flows):
  - `components/OnboardingFlow/index.tsx` (active route target; currently placeholder)
  - `components/onboarding/index.tsx`
  - `components/OnboardingQuestionnaire/index.tsx`
  - `components/EnhancedOnboarding/index.tsx`
- **Duplicate dashboard/sidebar/layout variants**:
  - `components/sidebar.tsx`, `components/Sidebar.tsx`, `components/sidebar-new.tsx`
  - multiple dashboard/layout client wrappers
- **Duplicate tier validation utilities**:
  - `lib/tier-validation.ts` and `lib/utils/tier-validation.ts`
- **Contract drift between APIs and schema in some legacy onboarding routes**:
  - route payloads referencing fields/models not aligned with current Prisma model shape

## 3) Existing onboarding architecture

- Auth flow routes users to `/onboarding` post-registration in certain cases.
- `/onboarding` currently renders `OnboardingFlow`, which is a placeholder.
- Other onboarding implementations exist but are fragmented and not a single canonical, production-on-path system.
- Existing onboarding data landing zones in schema:
  - `UserOnboardingData` (rich profile)
  - `UserSettings` (stable user preferences)

## 4) Existing dashboard adaptation logic

- Current adaptation is mostly:
  - plan/role checks
  - ad hoc conditional rendering in pages/components
  - nav badge-based soft gating (e.g., Pro)
- Navigation is currently static config-driven (`config/nav-links.ts`) and is the best extension point for adaptive activation metadata.
- No single canonical “income-profile activation engine” exists yet.

## 5) Existing user preference/profile systems

- `UserSettings`:
  - stable settings fields already used in settings API and UI
- `UserOnboardingData`:
  - rich onboarding/profile record model already available for behavioral/adaptive context
- Session identity in NextAuth:
  - role/subscription included in auth callbacks/session

## 6) Existing income-related models

- Income and revenue domain:
  - `Income`, `Job`, `Client`, `Service`, `Quote`, `Invoice`, `LineItem`, `Expense`
- Savings/planning domain:
  - `SavingsGoal`, `SavingsChallenge`, `FinancialGoal`, `BudgetAllocation`, etc.
- Recent contractor engine additions already provide:
  - `Job`-centric lifecycle and links to quote/invoice/expense

## 7) Recommended source-of-truth architecture

- **Canonical user income identity** should be persisted in Prisma (not hardcoded in UI/session only).
- Add a relational user-profile layer:
  - `UserIncomeProfile` records linked to `User`
  - enum-backed `IncomeProfileType`
- Keep activation deterministic:
  - profile selections -> activation resolver -> active features/widgets/nav/workflows
- Store adaptation hints in existing systems:
  - `UserSettings` and `UserOnboardingData` remain reusable context stores
- Keep NextAuth and Prisma as canonical runtime and persistence systems.

## 8) Risks of duplication

- Creating a second onboarding flow would increase data fragmentation and maintenance cost.
- Creating parallel income-role fields (e.g. `user.type`) would conflict with multi-profile requirements.
- Building separate contractor/paycheck dashboards now would duplicate logic before activation layer is stable.
- New global state stores for persisted profile data would duplicate server truth and drift from DB.

## 9) What should be extended vs replaced

- **Extend**
  - `OnboardingFlow` (active route target) to become canonical multi-income selector step
  - Prisma schema with additive income-profile relation model
  - `config/nav-links.ts` with activation metadata
  - Sidebar filtering logic to consume activation output
  - API layer with profile + activation endpoints
- **Replace/retire over time (not immediate hard-delete)**
  - alternate onboarding variants as canonical entrypoints
  - duplicate sidebar/layout variants as primary implementations

## 10) Safe migration strategy

1. **Additive schema first** (new enum/model + optional fields only).
2. Backfill defaults from existing user behavior/settings where needed.
3. Expose profile and activation APIs without breaking existing routes.
4. Integrate onboarding capture into existing `/onboarding` route component.
5. Apply non-destructive nav filtering (hide irrelevant modules, no route deletions).
6. Keep existing role/tier gates intact while layering income-profile activation.
7. Decommission duplicate onboarding/sidebar paths after stability verification.
