import { z } from 'zod';
import { DASHBOARD_WIDGETS, DASHBOARD_WIDGET_IDS } from './widgets';

export const dashboardLayoutItemSchema = z.object({
  id: z.string().min(1).max(64),
  visible: z.boolean(),
});

export const dashboardLayoutBodySchema = z.object({
  items: z.array(dashboardLayoutItemSchema).max(64),
});

export type StoredDashboardLayoutItem = z.infer<typeof dashboardLayoutItemSchema>;

export function buildDefaultLayoutItems(): StoredDashboardLayoutItem[] {
  return [...DASHBOARD_WIDGETS]
    .sort((a, b) => a.defaultOrder - b.defaultOrder)
    .map(w => ({ id: w.id, visible: w.defaultVisible }));
}

/**
 * Reconciles a stored layout against the current widget registry:
 *  - drops items whose widget no longer exists
 *  - deduplicates entries (first occurrence wins)
 *  - appends newly-registered widgets in their declared default order
 *  - preserves the user's chosen order for everything else
 */
export function reconcileLayout(stored: unknown): StoredDashboardLayoutItem[] {
  if (!Array.isArray(stored)) return buildDefaultLayoutItems();

  const known = new Set(DASHBOARD_WIDGET_IDS);
  const seen = new Set<string>();
  const out: StoredDashboardLayoutItem[] = [];

  for (const raw of stored) {
    const parsed = dashboardLayoutItemSchema.safeParse(raw);
    if (!parsed.success) continue;
    if (!known.has(parsed.data.id)) continue;
    if (seen.has(parsed.data.id)) continue;
    seen.add(parsed.data.id);
    out.push(parsed.data);
  }

  for (const w of [...DASHBOARD_WIDGETS].sort((a, b) => a.defaultOrder - b.defaultOrder)) {
    if (seen.has(w.id)) continue;
    out.push({ id: w.id, visible: w.defaultVisible });
  }

  return out;
}
