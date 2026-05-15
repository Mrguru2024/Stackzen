import { z } from 'zod';
import { isTransferDescription } from '@/lib/financial-automation/transactions';
import { recognizeMemo } from '@/lib/financial-automation/memo-recognition';

/** Mirrors `FinancialTransactionDirection` values without coupling unit tests to the generated client runtime. */
export type LedgerDirection = 'INFLOW' | 'OUTFLOW';

export const OPERATIONAL_TRANSACTION_CLASSES = [
  'INCOME',
  'EXPENSE',
  'TRANSFER',
  'SUBSCRIPTION',
  'PAYCHECK',
  'CONTRACTOR_PAYMENT',
  'GIG_PAYMENT',
] as const;

export type OperationalTransactionClass = (typeof OPERATIONAL_TRANSACTION_CLASSES)[number];

export const BUDGET_CATEGORY_SLUGS = [
  'HOUSING',
  'FOOD',
  'FUEL',
  'TOOLS',
  'BUSINESS',
  'SAVINGS',
  'TAXES',
  'ENTERTAINMENT',
  'UTILITIES',
  'HEALTHCARE',
  'OTHER',
] as const;

export type BudgetCategorySlug = (typeof BUDGET_CATEGORY_SLUGS)[number];

export const operationalTransactionClassSchema = z.enum(OPERATIONAL_TRANSACTION_CLASSES);
export const budgetCategorySlugSchema = z.enum(BUDGET_CATEGORY_SLUGS);

const PAYROLL_KEYWORDS = [
  'payroll', 'paycheck', 'direct dep', 'direct deposit', 'salary', 'wages',
  'gusto', 'adp', 'paychex', 'rippling', 'justworks', 'trinet', 'workday',
  'employer', 'employee earnings',
];
const GIG_KEYWORDS = [
  'uber', 'lyft', 'doordash', 'instacart', 'gopuff', 'grubhub', 'shipt',
  'rover', 'taskrabbit', 'wag', 'amazon flex', 'spark driver', 'favor',
  'caviar', 'postmates',
];
const CONTRACTOR_KEYWORDS = [
  'stripe', 'upwork', 'fiverr', 'paypal', '1099', 'contractor', 'freelance',
  'tremendous', 'gusto contractor', 'deel', 'wave payouts', 'invoice payment',
  'square payout',
];
const SUBSCRIPTION_KEYWORDS = [
  'netflix', 'spotify', 'hulu', 'adobe', 'apple.com/bill', 'apple services',
  'google storage', 'google one', 'dropbox', 'youtube premium', 'disney+',
  'disney plus', 'hbo', 'max.com', 'paramount+', 'peacock', 'audible',
  'icloud', 'microsoft 365', 'office 365', 'github', 'notion', 'figma',
  'openai', 'chatgpt', 'anthropic', 'claude.ai', 'cursor', 'vercel',
];

/** Plaid `personal_finance_category.detailed` → internal budget slug (best-effort). */
const PFC_DETAILED_TO_SLUG: Record<string, BudgetCategorySlug> = {
  FOOD_AND_DRINK: 'FOOD',
  FOOD_AND_DRINK_GROCERIES: 'FOOD',
  FOOD_AND_DRINK_RESTAURANT: 'FOOD',
  TRANSPORTATION_GAS: 'FUEL',
  TRANSPORTATION: 'FUEL',
  RENT_AND_UTILITIES: 'UTILITIES',
  RENT_AND_UTILITIES_RENT: 'HOUSING',
  HOME_IMPROVEMENT: 'HOUSING',
  MEDICAL: 'HEALTHCARE',
  MEDICAL_DENTAL_CARE: 'HEALTHCARE',
  GENERAL_MERCHANDISE: 'OTHER',
  ENTERTAINMENT: 'ENTERTAINMENT',
  GENERAL_SERVICES: 'OTHER',
  INCOME: 'OTHER',
};

export interface OperationalEnvelope {
  operationalClass: OperationalTransactionClass;
  budgetCategorySlug: BudgetCategorySlug;
  businessPersonal: 'BUSINESS' | 'PERSONAL';
}

const stackzenOperationalSchema = z
  .object({
    operationalClass: operationalTransactionClassSchema,
    budgetCategorySlug: budgetCategorySlugSchema,
    businessPersonal: z.enum(['BUSINESS', 'PERSONAL']),
  })
  .strict();

/** Keys written alongside raw Plaid JSON on `FinancialTransaction.metadata` — avoids clobbering upstream fields. */
export const STACKZEN_META = {
  class: 'stackzenOperationalClass',
  budget: 'stackzenBudgetCategorySlug',
  businessPersonal: 'stackzenBusinessPersonal',
} as const;

export function normalizeBudgetCategorySlug(input: string): BudgetCategorySlug {
  const up = input.trim().toUpperCase().replace(/\s+/g, '_');
  const parsed = budgetCategorySlugSchema.safeParse(up);
  return parsed.success ? parsed.data : 'OTHER';
}

export function mapPlaidDetailedToBudgetSlug(detailed?: string | null): BudgetCategorySlug {
  if (!detailed) return 'OTHER';
  const direct = PFC_DETAILED_TO_SLUG[detailed];
  if (direct) return direct;
  if (detailed.startsWith('RENT_AND_UTILITIES')) return 'UTILITIES';
  if (detailed.startsWith('FOOD_AND_DRINK')) return 'FOOD';
  if (detailed.startsWith('TRANSPORTATION')) return 'FUEL';
  if (detailed.startsWith('GENERAL_MERCHANDISE')) return 'OTHER';
  if (detailed.startsWith('HOME_IMPROVEMENT') || detailed.startsWith('RENT_AND_UTILITIES_RENT')) return 'HOUSING';
  return 'OTHER';
}

function normalizedDescriptionIncludes(desc: string, keywords: readonly string[]): boolean {
  const d = desc.toLowerCase();
  return keywords.some(k => d.includes(k));
}

/**
 * Operational classification layered on top of Prisma TransactionCategory.kind (INCOME/EXPENSE/TRANSFER).
 */
export function classifyOperationalTransaction(args: {
  direction: LedgerDirection;
  description: string;
  isTransferHint?: boolean;
  plaidPersonalFinanceDetailed?: string | null;
  userCategoryNameHint?: string | null;
  businessPersonalOverride?: 'BUSINESS' | 'PERSONAL' | null;
}): OperationalEnvelope {
  const desc = args.description || '';
  const transfer =
    Boolean(args.isTransferHint) ||
    isTransferDescription(desc) ||
    (args.plaidPersonalFinanceDetailed ?? '').startsWith('TRANSFER');

  if (transfer) {
    return {
      operationalClass: 'TRANSFER',
      budgetCategorySlug: 'OTHER',
      businessPersonal: args.businessPersonalOverride ?? 'PERSONAL',
    };
  }

  if (args.direction === 'INFLOW') {
    let operationalClass: OperationalTransactionClass = 'INCOME';
    const recognized = recognizeMemo({ description: desc });

    if (normalizedDescriptionIncludes(desc, PAYROLL_KEYWORDS)) {
      operationalClass = 'PAYCHECK';
    } else if (normalizedDescriptionIncludes(desc, GIG_KEYWORDS)) {
      operationalClass = 'GIG_PAYMENT';
    } else if (
      normalizedDescriptionIncludes(desc, CONTRACTOR_KEYWORDS) ||
      recognized.channel === 'stripe' ||
      recognized.channel === 'square'
    ) {
      operationalClass = 'CONTRACTOR_PAYMENT';
    }

    const budgetFromUser = args.userCategoryNameHint
      ? normalizeBudgetCategorySlug(args.userCategoryNameHint)
      : null;

    return {
      operationalClass,
      budgetCategorySlug: budgetFromUser && budgetFromUser !== 'OTHER' ? budgetFromUser : 'OTHER',
      businessPersonal:
        operationalClass === 'PAYCHECK' ? 'PERSONAL' : args.businessPersonalOverride ?? 'PERSONAL',
    };
  }

  // OUTFLOW
  const pfc = args.plaidPersonalFinanceDetailed ?? '';
  const subscriptionLike =
    pfc.includes('SUBSCRIPTION') ||
    pfc.includes('RECURRING') ||
    normalizedDescriptionIncludes(desc, SUBSCRIPTION_KEYWORDS);

  const slugFromPfc = mapPlaidDetailedToBudgetSlug(args.plaidPersonalFinanceDetailed ?? undefined);
  const slugFromCategory = args.userCategoryNameHint
    ? normalizeBudgetCategorySlug(args.userCategoryNameHint)
    : slugFromPfc;

  return {
    operationalClass: subscriptionLike ? 'SUBSCRIPTION' : 'EXPENSE',
    budgetCategorySlug: slugFromCategory,
    businessPersonal: args.businessPersonalOverride ?? 'PERSONAL',
  };
}

/** Merge classification into metadata without removing existing provider keys. */
export function mergeOperationalMetadata(
  metadata: Record<string, unknown> | null | undefined,
  operational: OperationalEnvelope
): Record<string, unknown> {
  const base = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? { ...metadata } : {};
  base[STACKZEN_META.class] = operational.operationalClass;
  base[STACKZEN_META.budget] = operational.budgetCategorySlug;
  base[STACKZEN_META.businessPersonal] = operational.businessPersonal;
  return base;
}

export function parseOperationalFromMetadata(metadata: unknown): OperationalEnvelope | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const o = metadata as Record<string, unknown>;
  const raw = {
    operationalClass: o[STACKZEN_META.class],
    budgetCategorySlug: o[STACKZEN_META.budget],
    businessPersonal: o[STACKZEN_META.businessPersonal],
  };
  const parsed = stackzenOperationalSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Income-like inflows eligible for paycheck-style automation (allocation, income alerts). */
export function isOperationalIncomeEligible(operationalClass: OperationalTransactionClass): boolean {
  return (
    operationalClass === 'INCOME' ||
    operationalClass === 'PAYCHECK' ||
    operationalClass === 'GIG_PAYMENT' ||
    operationalClass === 'CONTRACTOR_PAYMENT'
  );
}

/** Merge deterministic operational keys into txn metadata during ingest routes. */
export function mergeOperationalFromTransactionClassification(
  existingMetadata: Record<string, unknown> | null | undefined,
  classifyParams: Parameters<typeof classifyOperationalTransaction>[0],
) {
  return mergeOperationalMetadata(existingMetadata ?? {}, classifyOperationalTransaction(classifyParams));
}
