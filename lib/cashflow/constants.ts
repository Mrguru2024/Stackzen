/** Mirrors `STACKZEN_LOW_BALANCE_ALERT_USD` usage in financial-automation rules-engine. */
export function getLowBalanceThresholdUsd(): number {
  const raw = process.env.STACKZEN_LOW_BALANCE_ALERT_USD ?? '100';
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 100;
}

export const TRANSACTION_LOOKBACK_DAYS = 120;
export const MAX_TRANSACTION_ROWS = 8000;
