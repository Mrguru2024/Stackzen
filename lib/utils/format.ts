// Country normalization utility
export function normalizeCountryName(country: string): string {
  if (!country) return '';
  const map: Record<string, string> = {
    us: 'United States',
    usa: 'United States',
    'u.s.a.': 'United States',
    'u.s.': 'United States',
    'united states': 'United States',
    'united states of america': 'United States',
    america: 'United States',
    ca: 'Canada',
    can: 'Canada',
    canada: 'Canada',
    uk: 'United Kingdom',
    gb: 'United Kingdom',
    'great britain': 'United Kingdom',
    england: 'United Kingdom',
    'united kingdom': 'United Kingdom',
    australia: 'Australia',
    au: 'Australia',
    germany: 'Germany',
    de: 'Germany',
    france: 'France',
    fr: 'France',
    india: 'India',
    in: 'India',
    remote: 'Remote',
    // Add more as needed
  };
  const key = country.trim().toLowerCase();
  return map[key] || country.trim();
}

export const _formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const _formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

export const _formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const _formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

/** Stable name for callers that expect `formatCurrency`. */
export const formatCurrency = _formatCurrency;
