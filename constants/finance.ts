/**
 * Finance-related constants for the application
 */

export const _CURRENCY_CODES = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  CAD: 'CAD',
  AUD: 'AUD',
} as const;

export const _INCOME_TYPES = {
  SALARY: 'salary',
  FREELANCE: 'freelance',
  BUSINESS: 'business',
  INVESTMENT: 'investment',
  OTHER: 'other',
} as const;

export const _EXPENSE_CATEGORIES = {
  HOUSING: 'housing',
  TRANSPORTATION: 'transportation',
  FOOD: 'food',
  UTILITIES: 'utilities',
  HEALTHCARE: 'healthcare',
  ENTERTAINMENT: 'entertainment',
  EDUCATION: 'education',
  SAVINGS: 'savings',
  OTHER: 'other',
} as const;

export const _SAVINGS_GOALS = {
  EMERGENCY_FUND: 'emergency_fund',
  RETIREMENT: 'retirement',
  VACATION: 'vacation',
  HOME_DOWN_PAYMENT: 'home_down_payment',
  DEBT_PAYOFF: 'debt_payoff',
  INVESTMENT: 'investment',
  OTHER: 'other',
} as const;

export const _FINANCIAL_METRICS = {
  NET_WORTH: 'net_worth',
  CASH_FLOW: 'cash_flow',
  SAVINGS_RATE: 'savings_rate',
  DEBT_TO_INCOME: 'debt_to_income',
  EMERGENCY_FUND_RATIO: 'emergency_fund_ratio',
} as const;

export const _DEFAULT_CURRENCY = _CURRENCY_CODES.USD;

export const _DEFAULT_SAVINGS_RATE = 0.2; // 20%

export const _EMERGENCY_FUND_MONTHS = 6; // 6 months of expenses

export const CURRENCY_CODES = _CURRENCY_CODES;
export const INCOME_TYPES = _INCOME_TYPES;
export const EXPENSE_CATEGORIES = _EXPENSE_CATEGORIES;
export const SAVINGS_GOALS = _SAVINGS_GOALS;
export const FINANCIAL_METRICS = _FINANCIAL_METRICS;
export const DEFAULT_CURRENCY = _DEFAULT_CURRENCY;
export const DEFAULT_SAVINGS_RATE = _DEFAULT_SAVINGS_RATE;
export const EMERGENCY_FUND_MONTHS = _EMERGENCY_FUND_MONTHS;
