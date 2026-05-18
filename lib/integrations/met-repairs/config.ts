import 'server-only';

import { MET_REPAIRS_PRODUCTION_URL } from '@/lib/integrations/met-repairs/paths';

export { MET_REPAIRS_PRODUCTION_URL };

export function getMetRepairsApiUrl(): string {
  const fromEnv = process.env.MET_REPAIRS_API_URL?.trim().replace(/\/$/, '') ?? '';
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    return MET_REPAIRS_PRODUCTION_URL;
  }
  return '';
}

export function getMetRepairsApiKey(): string {
  return process.env.MET_REPAIRS_API_KEY?.trim() ?? '';
}

export function isMetRepairsConfigured(): boolean {
  const url = getMetRepairsApiUrl();
  const key = getMetRepairsApiKey();
  return url.startsWith('http') && key.length > 0;
}
