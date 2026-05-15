import { IncomeProfileType } from '@prisma/client';

export type ActivationFeatureKey =
  | 'dashboard.core'
  | 'income.tracker'
  | 'budgeting'
  | 'bills.recurring'
  | 'clients'
  | 'jobs'
  | 'quotes'
  | 'invoices'
  | 'deposits'
  | 'profit.tracking'
  | 'mileage'
  | 'tax.estimator'
  | 'platform.income'
  | 'sales.pipeline'
  | 'commissions'
  | 'passive.cashflow'
  | 'savings.goals'
  | 'ai.context';

export type ActivationSummary = {
  profiles: IncomeProfileType[];
  navKeys: string[];
  workflowKeys: string[];
  widgetKeys: string[];
  aiContextTags: string[];
  features: ActivationFeatureKey[];
};

type ProfileActivation = {
  features: ActivationFeatureKey[];
  navKeys: string[];
  workflowKeys: string[];
  widgetKeys: string[];
  aiContextTags: string[];
};

export const incomeProfileLabels: Record<IncomeProfileType, string> = {
  PAYCHECK: '9-to-5 paycheck',
  CONTRACTOR: 'Service business / contractor work',
  FREELANCE: 'Freelance / client work',
  GIG: 'Gig app income',
  SIDE_HUSTLE: 'Cash jobs / side hustles',
  BUSINESS: 'Online business / ecommerce',
  COMMISSION: 'Commission-based income',
  PASSIVE: 'Rental/passive income',
  OTHER: 'Other',
};

const profileActivationMap: Record<IncomeProfileType, ProfileActivation> = {
  PAYCHECK: {
    features: [
      'dashboard.core',
      'income.tracker',
      'budgeting',
      'bills.recurring',
      'savings.goals',
      'ai.context',
    ],
    navKeys: ['dashboard', 'financial-timeline', 'income-hub', 'expenses', 'savings', 'cards'],
    workflowKeys: ['paycheck-tracking', 'budget-allocation', 'bill-planning'],
    widgetKeys: ['paycheck-overview', 'budget-health', 'bill-calendar'],
    aiContextTags: ['income:paycheck', 'planning:budget-first'],
  },
  CONTRACTOR: {
    features: [
      'clients',
      'jobs',
      'quotes',
      'invoices',
      'deposits',
      'profit.tracking',
      'ai.context',
    ],
    navKeys: [
      'dashboard',
      'financial-timeline',
      'clients',
      'jobs',
      'quotes',
      'invoices',
      'income-hub/services',
    ],
    workflowKeys: ['client-intake', 'job-lifecycle', 'quote-to-invoice', 'deposit-tracking'],
    widgetKeys: ['job-pipeline', 'receivables', 'profit-summary'],
    aiContextTags: ['income:contractor', 'workflow:job-based'],
  },
  FREELANCE: {
    features: ['clients', 'jobs', 'quotes', 'invoices', 'profit.tracking', 'ai.context'],
    navKeys: [
      'dashboard',
      'financial-timeline',
      'clients',
      'jobs',
      'quotes',
      'invoices',
      'income-hub/services',
    ],
    workflowKeys: ['client-projects', 'proposal-flow', 'invoice-followups'],
    widgetKeys: ['client-retainers', 'invoice-aging'],
    aiContextTags: ['income:freelance', 'workflow:client-work'],
  },
  GIG: {
    features: ['income.tracker', 'mileage', 'tax.estimator', 'platform.income', 'ai.context'],
    navKeys: [
      'dashboard',
      'financial-timeline',
      'income-hub',
      'jobs',
      'expenses',
      'income/grants',
    ],
    workflowKeys: ['trip-log', 'platform-payout-reconcile', 'tax-envelope'],
    widgetKeys: ['gig-platform-split', 'mileage-tax-estimate'],
    aiContextTags: ['income:gig', 'taxes:high-variability'],
  },
  SIDE_HUSTLE: {
    features: ['income.tracker', 'budgeting', 'tax.estimator', 'ai.context'],
    navKeys: ['dashboard', 'financial-timeline', 'income-hub', 'jobs', 'expenses', 'savings'],
    workflowKeys: ['side-income-capture', 'cash-job-reconciliation'],
    widgetKeys: ['side-income-trend', 'estimated-tax-buffer'],
    aiContextTags: ['income:side-hustle'],
  },
  BUSINESS: {
    features: [
      'clients',
      'jobs',
      'quotes',
      'invoices',
      'profit.tracking',
      'sales.pipeline',
      'ai.context',
    ],
    navKeys: [
      'dashboard',
      'financial-timeline',
      'clients',
      'jobs',
      'quotes',
      'invoices',
      'analytics',
    ],
    workflowKeys: ['service-pipeline', 'a-r-management', 'margin-monitoring'],
    widgetKeys: ['pipeline-stage-metrics', 'gross-margin'],
    aiContextTags: ['income:business', 'operations:scaling'],
  },
  COMMISSION: {
    features: ['income.tracker', 'commissions', 'budgeting', 'ai.context'],
    navKeys: ['dashboard', 'financial-timeline', 'income-hub', 'analytics', 'expenses'],
    workflowKeys: ['commission-forecast', 'payout-reconcile'],
    widgetKeys: ['commission-forecast', 'quota-attainment'],
    aiContextTags: ['income:commission', 'volatility:medium'],
  },
  PASSIVE: {
    features: ['passive.cashflow', 'savings.goals', 'ai.context'],
    navKeys: ['dashboard', 'financial-timeline', 'analytics', 'expenses', 'savings'],
    workflowKeys: ['passive-cashflow-tracking', 'yield-review'],
    widgetKeys: ['passive-income-mix', 'cashflow-stability'],
    aiContextTags: ['income:passive', 'planning:long-term'],
  },
  OTHER: {
    features: ['dashboard.core', 'income.tracker', 'ai.context'],
    navKeys: ['dashboard', 'financial-timeline', 'income-hub', 'jobs', 'expenses'],
    workflowKeys: ['custom-income-capture'],
    widgetKeys: ['custom-income-overview'],
    aiContextTags: ['income:other'],
  },
};

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

/** Money operations hub + deterministic tools — always merged so income-profile gating does not hide operational workflows. */
const FINANCE_OPERATIONAL_NAV_KEYS = ['operational-center', 'cash-flow', 'money-control', 'goals/operational'] as const;

export function resolveIncomeProfileActivation(profiles: IncomeProfileType[]): ActivationSummary {
  const effectiveProfiles = profiles.length > 0 ? profiles : [IncomeProfileType.PAYCHECK];
  const activations = effectiveProfiles.map(profile => profileActivationMap[profile]);

  return {
    profiles: effectiveProfiles,
    features: unique(activations.flatMap(item => item.features)),
    navKeys: unique([
      ...activations.flatMap(item => item.navKeys),
      ...FINANCE_OPERATIONAL_NAV_KEYS,
      'income/sources',
    ]),
    workflowKeys: unique(activations.flatMap(item => item.workflowKeys)),
    widgetKeys: unique(activations.flatMap(item => item.widgetKeys)),
    aiContextTags: unique(activations.flatMap(item => item.aiContextTags)),
  };
}
