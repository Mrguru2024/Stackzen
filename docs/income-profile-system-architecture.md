# Income Profile System Architecture

## Objective

Enable each user to select and manage multiple income types, then safely activate relevant workflows/navigation/widgets/AI context without duplicating existing systems.

## Recommended schema approach

Use a **relational** model for profile selections, not `user.type`:

- New enum: `IncomeProfileType`
  - `PAYCHECK`
  - `CONTRACTOR`
  - `FREELANCE`
  - `GIG`
  - `SIDE_HUSTLE`
  - `BUSINESS`
  - `COMMISSION`
  - `PASSIVE`
  - `OTHER`

- New model: `UserIncomeProfile`
  - `id`
  - `userId` (FK -> `User`)
  - `type` (`IncomeProfileType`)
  - `isActive` (default true)
  - timestamps
  - unique `(userId, type)`

Rationale:

- scalable, queryable, composable
- avoids hardcoded single-role assumptions
- supports hybrid users naturally

## Relationship diagram

```text
User
 ├── UserSettings (1:1)
 ├── UserOnboardingData (1:1 optional)
 ├── UserIncomeProfile[] (1:n)   <-- NEW canonical income identity layer
 ├── Job[] / Quote[] / Invoice[] / Expense[] / Income[]
 └── (session/auth via NextAuth)
```

## Activation flow

```text
Onboarding/Profile Selection
        ↓
Persist UserIncomeProfile[]
        ↓
Activation Resolver (server utility)
        ↓
ActiveFeatureSet {
  navKeys, workflowKeys, widgetKeys, aiContextTags
}
        ↓
Consumed by:
- Sidebar/nav filtering
- Workflow availability checks
- Dashboard module composition (future)
- AI context enrichment
```

## Dashboard adaptation strategy

- Keep existing dashboard implementation.
- Add an activation resolver utility that returns feature keys.
- Use activation keys to safely include/exclude nav/dashboard modules.
- Do not rebuild dashboards now; provide adaptation layer and integration points only.

## Onboarding adaptation strategy

- Reuse existing canonical route: `/onboarding` with `components/OnboardingFlow`.
- Replace placeholder with multi-select income capture question.
- Persist selections via dedicated API.
- Keep onboarding extensible for additional steps later.
- Do not introduce another onboarding route/flow.

## AI context strategy

- Activation resolver emits `aiContextTags` from selected profiles.
- AI routes/utilities should consume tags + existing `UserOnboardingData`.
- Keep AI logic additive: enrich context, do not fork separate AI systems.

## Migration strategy

1. Add enum/model in Prisma (`IncomeProfileType`, `UserIncomeProfile`).
2. Deploy migration and generate Prisma client.
3. Add APIs:
   - profile read/update
   - activation summary
4. Integrate onboarding multi-select into `OnboardingFlow`.
5. Integrate sidebar filtering using activation keys.
6. Rollout with defaults (empty selection -> base features + recommended fallback profile).

## Anti-duplication strategy

- One canonical profile store: Prisma `UserIncomeProfile`.
- One canonical onboarding entrypoint: `/onboarding` -> `OnboardingFlow`.
- One activation resolver utility used by API and UI.
- Extend existing nav config with `featureKey`; no second nav tree.
- Reuse `UserSettings`/`UserOnboardingData` for preference/context enrichment.
