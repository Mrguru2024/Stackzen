import { randomBytes } from 'crypto';

/** Prefix helps identify keys in logs without exposing the secret. */
export const MET_REPAIRS_API_KEY_PREFIX = 'sz_met_';

export function generateMetRepairsIntegrationApiKey(): string {
  return `${MET_REPAIRS_API_KEY_PREFIX}${randomBytes(32).toString('hex')}`;
}
