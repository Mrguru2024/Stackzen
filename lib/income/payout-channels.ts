/** Preset payout / deposit channels users can track (no OAuth; manual + bank sync complement). */
export const PAYOUT_CHANNEL_OPTIONS = [
  { id: 'cash_app', label: 'Cash App', description: 'Log payouts below or match deposits after linking your bank.' },
  { id: 'venmo', label: 'Venmo', description: '' },
  { id: 'paypal', label: 'PayPal', description: '' },
  { id: 'zelle', label: 'Zelle', description: '' },
  { id: 'apple_cash', label: 'Apple Cash', description: '' },
  { id: 'google_pay', label: 'Google Pay', description: '' },
  { id: 'stripe_payouts', label: 'Stripe payouts', description: '' },
  { id: 'employer_direct', label: 'Employer direct deposit', description: '' },
  { id: 'other', label: 'Other', description: 'Use custom labels when adding income entries.' },
] as const;

export type PayoutChannelId = (typeof PAYOUT_CHANNEL_OPTIONS)[number]['id'];

export type IncomeSourcesPayload = {
  payoutChannelIds: string[];
  customLabels: string[];
};

export function parseIncomeSourcesJson(raw: unknown): IncomeSourcesPayload {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { payoutChannelIds: [], customLabels: [] };
  }
  const o = raw as Record<string, unknown>;
  const ids = o.payoutChannelIds;
  const labels = o.customLabels;
  return {
    payoutChannelIds: Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : [],
    customLabels: Array.isArray(labels) ? labels.filter((x): x is string => typeof x === 'string') : [],
  };
}
