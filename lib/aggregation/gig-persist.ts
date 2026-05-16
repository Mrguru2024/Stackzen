/** RSS / feed importers attach scraped `Gig` rows to this user. Set in `.env` for environments that run aggregators. */
export function getAggregatorUserIdForGigs(): string | null {
  const id = process.env.AGGREGATOR_USER_ID?.trim();
  return id || null;
}

export const DEFAULT_AGGREGATED_GIG_TRADE_TYPE = 'Job';
