/**
 * Deterministic discretionary outflow detection for the reserve / allocation
 * intelligence snapshot.
 *
 * - Pure functions only (no Prisma) so they are safely unit-testable.
 * - The category list is intentionally **explicit and code-visible**; we do
 *   NOT introduce a new schema flag for "discretionary" categories.
 * - Matching is case-insensitive substring on either `categoryName` or
 *   `subcategory` of a `FinancialTransaction`.
 */

export interface DiscretionaryTxRow {
  categoryName: string | null;
  subcategory: string | null;
  amount: number;
}

export interface DiscretionaryCategorySummaryDto {
  name: string;
  usd: number;
}

export interface DiscretionaryOutflowStatsDto {
  lookbackDays: number;
  sampleSize: number;
  totalOutflowUsd: number;
  discretionaryOutflowUsd: number;
  discretionaryShare: number;
  topDiscretionaryCategories: DiscretionaryCategorySummaryDto[];
}

/**
 * Lowercase substring patterns considered discretionary for reserve-pressure
 * gating. Reviewable in source; no hidden tagging. Aligned with the names
 * shipped by the system seed and Plaid category mappings.
 */
export const DISCRETIONARY_CATEGORY_PATTERNS: readonly string[] = [
  'dining',
  'restaurant',
  'coffee',
  'cafe',
  'bar',
  'alcohol',
  'entertainment',
  'streaming',
  'music',
  'movies',
  'games',
  'shopping',
  'clothing',
  'apparel',
  'beauty',
  'salon',
  'spa',
  'hobbies',
  'recreation',
  'travel',
  'vacation',
  'gifts',
  'subscriptions',
];

export const DISCRETIONARY_PRESSURE_THRESHOLD = 0.4;
export const DISCRETIONARY_LOOKBACK_DAYS = 30;
export const DISCRETIONARY_TOP_CATEGORY_COUNT = 3;

export function isDiscretionaryLabel(
  label: string | null | undefined,
  patterns: readonly string[] = DISCRETIONARY_CATEGORY_PATTERNS
): boolean {
  if (!label) return false;
  const l = label.toLowerCase();
  for (const p of patterns) {
    if (l.includes(p)) return true;
  }
  return false;
}

/**
 * Compute deterministic discretionary outflow stats over the supplied rows.
 * The caller is responsible for restricting `rows` to OUTFLOW, non-transfer,
 * trailing-window transactions. `amount` is treated as an absolute magnitude.
 */
export function computeDiscretionaryOutflowStats(
  rows: DiscretionaryTxRow[],
  lookbackDays: number = DISCRETIONARY_LOOKBACK_DAYS
): DiscretionaryOutflowStatsDto {
  let totalOutflowUsd = 0;
  let discretionaryOutflowUsd = 0;
  const byCategory = new Map<string, number>();

  for (const r of rows) {
    const mag = Math.abs(r.amount);
    if (!Number.isFinite(mag) || mag <= 0) continue;
    totalOutflowUsd += mag;

    const matchedLabel =
      isDiscretionaryLabel(r.categoryName)
        ? r.categoryName
        : isDiscretionaryLabel(r.subcategory)
          ? r.subcategory
          : null;

    if (matchedLabel) {
      discretionaryOutflowUsd += mag;
      const key = matchedLabel.trim();
      byCategory.set(key, (byCategory.get(key) ?? 0) + mag);
    }
  }

  const discretionaryShare =
    totalOutflowUsd > 0 ? discretionaryOutflowUsd / totalOutflowUsd : 0;

  const topDiscretionaryCategories: DiscretionaryCategorySummaryDto[] = Array.from(byCategory.entries())
    .map(([name, usd]) => ({ name, usd }))
    .sort((a, b) => b.usd - a.usd || a.name.localeCompare(b.name))
    .slice(0, DISCRETIONARY_TOP_CATEGORY_COUNT);

  return {
    lookbackDays,
    sampleSize: rows.length,
    totalOutflowUsd: roundUsd(totalOutflowUsd),
    discretionaryOutflowUsd: roundUsd(discretionaryOutflowUsd),
    discretionaryShare: roundShare(discretionaryShare),
    topDiscretionaryCategories: topDiscretionaryCategories.map(c => ({
      name: c.name,
      usd: roundUsd(c.usd),
    })),
  };
}

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100;
}

function roundShare(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export function isDiscretionaryPressure(
  stats: DiscretionaryOutflowStatsDto,
  threshold: number = DISCRETIONARY_PRESSURE_THRESHOLD
): boolean {
  if (stats.totalOutflowUsd <= 0) return false;
  return stats.discretionaryShare >= threshold;
}
