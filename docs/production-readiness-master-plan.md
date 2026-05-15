# Production Readiness Master Plan

## Objective

Ensure every user-facing workflow has real data, real mutations, error handling, and measurable UX value (no mock-only actions, no dead buttons, no placeholder-only flows).

## Definition of Done (per page/workflow)

- Reads data from real API/DB (no local mock arrays for production pages).
- Primary CTA triggers real mutation and persists changes.
- Loading/empty/error/success states are visible and actionable.
- Access control enforced where relevant.
- Events/audit logging for admin-impacting actions.
- Basic regression test for happy path + primary error path.

## Current Findings (initial audit pass)

High-priority functional gaps identified in active product areas:

1. Mentor ecosystem has mock/placeholder surface area:
   - `components/mentors/MentorDirectory/index.tsx`
   - `components/mentors/MentorProfile/MentorProfileModal.tsx`
   - `components/mentors/BookingFlow/index.tsx`
2. Multiple pages/components still contain placeholder or TODO behavior discovered by scan.
3. Import/runtime regressions were present recently (already fixed in this pass):
   - `authOptions` import source mismatch
   - `logError` export mismatch
   - Redis runtime crash
   - unapplied migrations (now applied)

## Execution Phases

### Phase 1: Critical Runtime and Core Workflow Integrity

- [x] Fix hard runtime breakages (Redis/init, import regressions).
- [x] Apply pending migrations.
- [x] Convert admin mentor actions from mock to real API mutations.
- [x] Convert mentor discovery + profile + booking to real end-to-end flow.
- [x] Validate top dashboard read paths for schema compatibility and no 500s.

### Phase 2: High-Traffic User Workflows

- [ ] Jobs (create, transitions, invoice/deposit actions, details).
- [x] Invoices/payments (create/send/pay core states).
- [ ] Expenses/income CRUD end-to-end.
- [ ] Clients/services CRUD paths.

### Additional Progress (this run)

- [x] Income invoices manager buttons now perform real send/download actions via API.
- [x] Added canonical invoice send/download API aliases for dashboard consumers.
- [x] New invoice page payload now matches API schema (`dueDate` ISO datetime).
- [x] Income affiliates, investments, and challenges CTAs now execute actionable flows.
- [x] Grants “Apply Now” now creates persistent (browser) application tracking entries.
- [x] Gear marketplace CTAs now route to actionable pages; added “Sell Gear” listing form.
- [x] Profile settings now saves through `PATCH /api/profile` with success/error UX.
- [x] Goals page now persists add/edit/delete actions locally across reloads.
- [x] Legacy `/invoices` dashboard route now consolidates to `/income/invoices`.
- [x] Added missing analytics/portfolio/AI/achievements API routes used by income sub-pages.
- [x] Added server-side challenge creation endpoint (`POST /api/challenges`) for create flow.
- [x] Replaced placeholder bookings route with real bookings dashboard backed by Prisma.
- [x] Consolidated placeholder `/income/services` page to canonical `/income-hub/services`.
- [x] Replaced mock-heavy financial wellness page with API-backed progress + action center.
- [x] Upgraded financial mentorship and journey APIs from mock responses to DB-backed reads/writes.
- [x] Replaced mock smart-saving missions API with DB-backed mission generation + completion endpoint.
- [x] Fixed admin analytics API to align with current mentor schema fields (`price`, verification state).
- [x] Hardened Redis integrations to gracefully degrade when Redis is unavailable in local/dev.

### Phase 3: Long-Tail and Polishing

- [ ] Settings/security pages with complete write paths and confirmations.
- [ ] Developer/admin utility pages: remove non-functional CTAs.
- [ ] Consistent UX patterns (toasts, retry, optimistic updates where safe).

## Production Guardrails to Enforce During Refactor

- No merged code with:
  - mock arrays in production components
  - disabled CTAs without explicit “coming soon” gating + tracking
  - TODO placeholders in active route handlers
- All changed workflows require:
  - typecheck pass
  - lint pass (changed files)
  - at least one verification step per changed API/UI flow

## Immediate Next Slice (in progress)

Mentor user-facing funnel hardening:

1. [x] Replace mentor directory mock dataset with `/api/mentors` live fetch.
2. [x] Make profile modal data-driven from selected mentor.
3. [x] Make booking flow create real mentor sessions through `/api/mentors/sessions`.
4. Add clear loading/error/success UX around booking.
