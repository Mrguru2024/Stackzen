# Mobile Operational Experience Hardening — Phase 1 Audit

## 1. Existing responsive systems

| Area | Mechanism |
|------|-------------|
| **Dashboard shell** | `app/(dashboard)/layout.tsx` — `flex` + `main` `overflow-auto`; `pt-16 md:pt-0` reserves space for **fixed mobile menu** trigger. |
| **Sidebar** | `components/sidebar.tsx` — `MobileSidebar` uses **Sheet** (left drawer); `DesktopSidebar` `hidden md:flex`. Nav links from `config/nav-links.ts`. |
| **Operations hub** | `UnifiedOperationalWorkspace` — responsive grids (`sm:grid-cols-2`, `lg:grid-cols-3`), `flex-wrap` on workflow buttons, typography `md:text-base`. |
| **Activation panel** | `OperationalActivationPanel` — checklist `sm:grid-cols-2`; NBA list stacked. |
| **Money Control** | `components/money-control/index.tsx` — header `flex-col sm:flex-row`; `TabsList` `flex flex-wrap`; ledger `overflow-x-auto` table. |
| **Realtime** | `useOperationalAttentionRealtime` — debounced **450ms** refetch on `AutomationNotification` / `FinancialEvent` changes (battery/network friendly). |

## 2. Existing mobile workflow strengths

- **Sheet-based mobile nav** avoids permanent narrow sidebar clutter.
- **Deep links** from operational actions (`resolveActionHref`) land on `money-control?tab=…&txnId=…`, invoices, jobs, goals — **same routes** as desktop.
- **`UserOperationalCheckpoint`** supports resuming Money Control transaction review from workspace.
- **`OperationalAlertCards` `compactTrust`** trims explainability for embedded contexts (e.g. Money Control tab).
- **Income activation** merges operational nav keys so Operations hub / Cash Flow / Money Control are not hidden by profile gating.

## 3. Existing mobile friction risks

- **Operational cards**: trust + `OperationalExplainabilityPanel` stack **above** workflow action buttons; on small screens users scroll through long “why” text before primary **Review transaction / Open invoice** CTAs.
- **Dense secondary controls**: Mark read, Snooze, Dismiss share one `flex-wrap` row with **small** `size="sm"` buttons — **below ~44px** touch comfort.
- **Money Control tabs**: `flex-wrap` can wrap tabs unpredictably; many tabs increase **scan cost** on narrow screens; no horizontal scroll “rail” for thumb reach.
- **Ledger table**: horizontal scroll required on mobile (acceptable) but **“Correct”** is a small control at row end.
- **Activation NBA**: primary “Open workflow” is a **link-styled** control; dismiss is icon-only — easy to miss-hit.

## 4. Operational overload risks

- **Operations hub** shows Activation panel + resume card + workflow strip + adaptive shortcuts + full alert list — **high vertical stack** before triage.
- **Explainability JSON** blocks add scroll depth per alert on mobile.
- **Duplicate signals** partially mitigated by `dedupeOperationalAlerts` in workspace — still multiple cards for different domains.

## 5. Navigation complexity

- **Operations hub** lives under **Finance** category in nav — correct grouping but **not** at top of list; mobile users open Sheet and scroll categories.
- **Many finance entries** (Operations hub, Cash Flow, Money Control, Goals) — related but **separate** destinations; workspace shortcuts partially compensate.

## 6. Action-density problems

- `OperationalAlertCards`: up to **4 triage buttons** + N workflow actions + trust + explainability — high density.
- Workflow continuity card: four controls in `flex-wrap` — on narrow screens **two per row** inconsistently.

## 7. Performance concerns

- Operations hub **parallel fetch** (alerts + activation + checkpoint) — good; loading state for alerts is **text only** (“Loading queue…”) — weak **perceived performance**.
- Realtime debounce reduces churn — good for mobile; no separate mobile throttle (correct — no duplicate logic).

## 8. Recommended mobile operational architecture

1. **Primary actions first** in DOM/visual order on small screens: workflow `actions` before long trust/explainability.
2. **Progressive disclosure** for trust + explainability on `< md` via native `<details>` (no new dependency, no duplicate content logic).
3. **Touch targets** ≥ ~44px for triage and primary navigation controls (`min-h-11`, full-width primary CTA where appropriate).
4. **Money Control tabs**: horizontal scroll + `snap` + `shrink-0` for predictable thumb browsing.
5. **Skeleton placeholders** for alert queue loading to improve perceived speed.
6. **Optional thumb-zone** tweaks: full-width primary workflow button on `sm` max breakpoint.

## 9. Safe implementation strategy

- Touch layout changes **only** in shared components (`OperationalAlertCards`, `UnifiedOperationalWorkspace`, `OperationalActivationPanel`, `MoneyControl` tabs, mobile nav link padding).
- **No** duplicate hooks, stores, or APIs.
- Preserve `compactTrust` behavior for embedded Money Control.
- Validate with `npm run typecheck` and existing/affected tests.

### Files reviewed (representative)

- `components/operational-workspace/UnifiedOperationalWorkspace/index.tsx`
- `components/operational-workspace/OperationalActivationPanel/index.tsx`
- `components/operational-center/OperationalAlertCards/index.tsx`
- `components/operational-center/OperationalExplainabilityPanel/index.tsx`
- `components/money-control/index.tsx` (header + tabs + ledger)
- `components/sidebar.tsx` (mobile sheet)
- `app/(dashboard)/layout.tsx`
- `config/nav-links.ts`
- `hooks/useOperationalAttentionRealtime.ts`
