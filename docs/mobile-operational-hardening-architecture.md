# Mobile Operational Hardening — Architecture

## Principles

1. **One product, one routing model** — all mobile improvements are **presentation and ordering** on existing DTOs and APIs.
2. **Operational clarity over density** — collapse non-blocking detail behind disclosure on small viewports.
3. **Thumb-first execution** — primary workflow actions are easy to hit; secondary triage is still reachable but grouped.
4. **No parallel mobile state** — reuse `OperationalAlertDto`, checkpoint, realtime debounce unchanged.

## Operational alert card layout

### Viewport split

- **`< md`**: Order = title/meta → **workflow actions** (primary CTA emphasized) → **`<details>`** “Why & explainability” containing trust copy + `OperationalExplainabilityPanel`.
- **`≥ md`**: Preserve existing vertical layout (trust expanded, explainability visible).

### Touch targets

- Primary workflow link button: `min-h-11`, `w-full` below `sm`, `sm:w-auto` at `sm+`.
- Triage row: `grid grid-cols-2 gap-2` for Mark read / Snooze; Dismiss spans row or sits in third slot with adequate height on smallest screens — use `grid-cols-2` with dismiss full width second row on `xs` only if needed — implement as `grid grid-cols-2 sm:flex sm:flex-wrap` with `min-h-11` on each control.

## Operations hub page

- Tighter vertical rhythm on small screens: `space-y-5 md:space-y-8`.
- Title scale: `text-2xl sm:text-3xl`.
- Workflow continuity: `grid grid-cols-1 gap-2` with `min-h-11` buttons; `sm:flex sm:flex-wrap`.
- Shortcut tiles: `min-h-[44px]` + `touch-manipulation` on anchors.
- Alert queue loading: **Skeleton** blocks (2–3) instead of plain text.

## Activation panel

- Primary NBA link: default button styling, **full width** `< sm`.
- Dismiss control: **44px** hit target.

## Money Control tabs

- `TabsList`: `inline-flex w-full flex-nowrap overflow-x-auto gap-1 pb-1` + optional `snap-x` / `snap-mandatory` + `TabsTrigger shrink-0 min-h-11 touch-manipulation` for scrollable tab rail on phones.

## Mobile sidebar

- Increase vertical padding / min height on mobile nav rows for tap comfort (`min-h-11` alignment).

## Realtime

- Keep single debounce path; no mobile-only subscription logic.

## Validation

- Typecheck + manual smoke: iPhone width in devtools — alerts, tabs scroll, details toggles, no horizontal page overflow beyond intentional table/tab rails.
