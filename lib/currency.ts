export type Currency = {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  decimalSeparator: string;
  thousandsSeparator: string;
  position: 'prefix' | 'suffix';
};

export const currencies: Record<string, Currency> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    position: 'prefix',
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimalPlaces: 2,
    decimalSeparator: ',',
    thousandsSeparator: '.',
    position: 'prefix',
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    position: 'prefix',
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    decimalPlaces: 0,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    position: 'prefix',
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    position: 'prefix',
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    position: 'prefix',
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    position: 'prefix',
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    position: 'prefix',
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'Fr',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: "'",
    position: 'suffix',
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    decimalPlaces: 2,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    position: 'prefix',
  },
};

export function formatCurrency(
  amount: number,
  currencyCode = 'USD',
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    compact?: boolean;
  } = {}
): string {
  const currency = currencies[currencyCode] || currencies.USD;
  const { showSymbol = true, showCode = false, compact = false } = options;

  let formattedAmount: string;

  if (compact && amount >= 1000) {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const order = Math.floor(Math.log10(amount) / 3);
    const value = amount / Math.pow(1000, order);
    formattedAmount = value.toFixed(1) + suffixes[order];
  } else {
    formattedAmount = amount.toFixed(currency.decimalPlaces);
  }

  // Add thousands separators
  const parts = formattedAmount.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);
  formattedAmount = parts.join(currency.decimalSeparator);

  // Add currency symbol and/or code
  const symbol = showSymbol ? currency.symbol : '';
  const code = showCode ? ` ${currency.code}` : '';

  return currency.position === 'prefix'
    ? `${symbol}${formattedAmount}${code}`
    : `${formattedAmount}${symbol}${code}`;
}

export function parseCurrency(value: string, currencyCode = 'USD'): number {
  const currency = currencies[currencyCode] || currencies.USD;
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const thousandsRegex = new RegExp(escape(currency.thousandsSeparator), 'g');
  const decimalRegex = new RegExp(escape(currency.decimalSeparator), 'g');
  const cleanValue = value
    .replace(currency.symbol, '')
    .replace(thousandsRegex, '')
    .replace(decimalRegex, '.');
  return parseFloat(cleanValue) || 0;
}

export function getCurrencyOptions(): Array<{
  value: string;
  label: string;
}> {
  return Object.values(currencies).map(currency => ({
    value: currency.code,
    label: `${currency.code} (${currency.symbol}) - ${currency.name}`,
  }));
}
