import type { SubscriptionLevel } from '@prisma/client';
import { hasAdvancedAutomationAccess, ALLOCATION_FREE_PRESETS } from '@/lib/financial-automation/premium';
import { SPEND_ROUND_UP_ALLOCATION_MODE } from '@/lib/financial-automation/spend-round-up-rule';
import { FIXED_SCHEDULE_ALLOCATION_MODE } from '@/lib/financial-automation/fixed-schedule-save-rule';
import { CATEGORY_SPEND_TAX_ALLOCATION_MODE } from '@/lib/financial-automation/category-spend-tax-rule';

export type RuleTemplateId =
  | 'BUDGET_SPLIT_50_30_20'
  | 'BUDGET_SPLIT_40_30_30'
  | 'BUDGET_SPLIT_CUSTOM'
  | 'PAYCHECK_SAVINGS_BOOST'
  | 'SPEND_ROUND_UP_SAVINGS'
  | 'SCHEDULED_FIXED_SAVE_USD'
  | 'CATEGORY_SPEND_TAX'
  | 'TAX_RESERVE_ON_SELF_EMPLOYED'
  | 'CATEGORY_GUARDRAIL';

export type RuleTemplateCategory = 'BUDGET' | 'SAVINGS' | 'TAXES' | 'GUARDRAIL';

export type RuleTemplateInputId =
  | 'allocationsCustom'
  | 'savingsBucket'
  | 'savingsPercent'
  | 'roundUpBucket'
  | 'roundUpIncrement'
  | 'scheduleCadence'
  | 'scheduleBucket'
  | 'scheduleAmountUsd'
  | 'scheduleDayOfWeek'
  | 'scheduleDayOfMonth'
  | 'taxCategory'
  | 'taxDestinationBucket'
  | 'taxSpendPercent'
  | 'taxMaxAmountUsd'
  | 'reserveBucket'
  | 'reservePercent'
  | 'guardrailCategory'
  | 'guardrailLimit'
  | 'guardrailWarnAt';

export interface RuleTemplateInputDefinition {
  id: RuleTemplateInputId;
  label: string;
  helper?: string;
  kind: 'number' | 'text' | 'allocations';
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  defaultValue?: number | string | Array<{ bucket: string; percent: number }>;
}

export interface RuleTemplateDescriptor {
  id: RuleTemplateId;
  category: RuleTemplateCategory;
  title: string;
  /** One-liner shown on the template card. */
  summary: string;
  /** Longer guidance shown in the builder sheet. Frame it as instructions, not coaching. */
  guidance: string;
  /** Outcomes to set expectations: what happens when the rule fires. */
  outcomes: string[];
  /** Premium tier flag (when true, only PRO/LIFETIME/ZEN_PLUS can instantiate). */
  premium: boolean;
  /** Visual badge slot. */
  badge?: 'POPULAR' | 'PRO' | 'NEW';
  inputs: RuleTemplateInputDefinition[];
}

export interface AllocationLine {
  bucket: string;
  percent: number;
}

export interface AutomationRulePayload {
  name: string;
  type: 'ALLOCATION' | 'GUARDRAIL' | 'NOTIFICATION' | 'RECURRING_TRANSFER';
  triggerType:
    | 'TRANSACTION_POSTED'
    | 'PAYCHECK_DETECTED'
    | 'SCHEDULED'
    | 'BILL_DUE'
    | 'BALANCE_THRESHOLD';
  conditions?: Record<string, unknown>;
  actions?: Array<Record<string, unknown>>;
  schedule?: Record<string, unknown>;
  enabled?: boolean;
  allocationPreset?: 'FIFTY_THIRTY_TWENTY' | 'FORTY_THIRTY_THIRTY';
}

export interface TemplateInstantiationInput {
  allocationsCustom?: AllocationLine[];
  savingsBucket?: string;
  savingsPercent?: number;
  roundUpBucket?: string;
  roundUpIncrement?: number;
  scheduleCadence?: string;
  scheduleBucket?: string;
  scheduleAmountUsd?: number;
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  taxCategory?: string;
  taxDestinationBucket?: string;
  taxSpendPercent?: number;
  taxMaxAmountUsd?: number;
  reserveBucket?: string;
  reservePercent?: number;
  guardrailCategory?: string;
  guardrailLimit?: number;
  guardrailWarnAt?: number;
}

export interface TemplateBuildResult {
  rulePayload: AutomationRulePayload;
  /** Optional companion `SpendingGuardrailPolicy` record to persist alongside a GUARDRAIL rule. */
  guardrailPolicy?: {
    categoryName: string | null;
    limitAmount: number;
    warnAtPercent: number;
  };
}

const INCOME_ELIGIBLE_CLASSES = ['INCOME', 'PAYCHECK', 'GIG_PAYMENT', 'CONTRACTOR_PAYMENT'] as const;

const TEMPLATES: Record<RuleTemplateId, RuleTemplateDescriptor> = {
  BUDGET_SPLIT_50_30_20: {
    id: 'BUDGET_SPLIT_50_30_20',
    category: 'BUDGET',
    title: '50 / 30 / 20 budget split',
    summary: 'Split every deposit into needs, wants, and savings buckets.',
    guidance:
      'Every income deposit (paycheck, direct deposit, gig payout, contractor payment) is automatically routed: 50% to needs, 30% to wants, 20% to savings. Turn it off anytime — nothing moves while the rule is paused.',
    outcomes: [
      'Needs envelope grows by 50% of each deposit.',
      'Wants envelope grows by 30%.',
      'Savings envelope grows by 20%.',
    ],
    premium: false,
    badge: 'POPULAR',
    inputs: [],
  },
  BUDGET_SPLIT_40_30_30: {
    id: 'BUDGET_SPLIT_40_30_30',
    category: 'BUDGET',
    title: '40 / 30 / 30 budget split',
    summary: 'Higher savings rate for irregular income earners.',
    guidance:
      'Every income deposit is automatically split: 40% to needs, 30% to wants, 30% to savings. Useful when your income is variable and you want a thicker buffer. Toggle off any time.',
    outcomes: [
      'Needs envelope grows by 40% of each deposit.',
      'Wants envelope grows by 30%.',
      'Savings envelope grows by 30%.',
    ],
    premium: true,
    badge: 'PRO',
    inputs: [],
  },
  BUDGET_SPLIT_CUSTOM: {
    id: 'BUDGET_SPLIT_CUSTOM',
    category: 'BUDGET',
    title: 'Custom budget split',
    summary: 'Define your own envelopes and percentages — they must total 100%.',
    guidance:
      'Pick the envelopes that match your money plan and assign a percentage to each. Every income deposit gets routed across them in real time. Pause or rewrite the split whenever your plan changes.',
    outcomes: [
      'Each envelope grows by its configured share of every deposit.',
      'Percentages must total 100%.',
      'Rule pauses cleanly — no money moves until you re-enable it.',
    ],
    premium: true,
    badge: 'PRO',
    inputs: [
      {
        id: 'allocationsCustom',
        label: 'Envelopes & percentages',
        kind: 'allocations',
        helper: 'Add envelopes and assign weights. They must total 100%.',
        defaultValue: [
          { bucket: 'needs', percent: 50 },
          { bucket: 'wants', percent: 30 },
          { bucket: 'savings', percent: 20 },
        ],
      },
    ],
  },
  SPEND_ROUND_UP_SAVINGS: {
    id: 'SPEND_ROUND_UP_SAVINGS',
    category: 'SAVINGS',
    title: 'Round up every purchase',
    summary: 'Qapital-style spare change: each card spend rounds up to the next dollar (or step you pick) into one envelope.',
    guidance:
      'Whenever a purchase posts (outflow, not internal transfers), StackZen computes the gap to the next multiple of your increment and credits that amount to the envelope you name. It is ledger automation tied to that transaction — the same model as other SmartAllocation lines.',
    outcomes: [
      'Each qualifying purchase can add a few cents or dollars to your chosen envelope.',
      'Exact-dollar purchases produce no round-up for that transaction.',
      'Transfers and transfer-like rows are skipped.',
    ],
    premium: false,
    badge: 'NEW',
    inputs: [
      {
        id: 'roundUpBucket',
        label: 'Round-up envelope',
        kind: 'text',
        helper: 'Creates or fills an AUTOMATION_ENVELOPE with this name (e.g. "round_up", "vacation").',
        placeholder: 'round_up',
        defaultValue: 'round_up',
      },
      {
        id: 'roundUpIncrement',
        label: 'Round up to the next (dollars)',
        kind: 'number',
        min: 0.5,
        max: 100,
        step: 0.5,
        defaultValue: 1,
      },
    ],
  },
  SCHEDULED_FIXED_SAVE_USD: {
    id: 'SCHEDULED_FIXED_SAVE_USD',
    category: 'SAVINGS',
    title: 'Scheduled fixed save',
    summary: 'Qapital-style recurring set-aside: move the same dollar amount into one envelope on a weekly or monthly UTC schedule.',
    guidance:
      'StackZen runs this once per calendar day via a secured cron job. When today matches your schedule (UTC weekday for weekly, UTC day-of-month for monthly), the fixed amount is credited to your envelope as a SmartAllocation without a bank transaction row. Pick a weekday (0=Sunday … 6=Saturday) or a day-of-month (1–28).',
    outcomes: [
      'Creates a predictable automatic envelope contribution.',
      'Skips silently if the rule already ran successfully for that calendar day.',
      'Pause the rule anytime to stop future credits.',
    ],
    premium: false,
    badge: 'NEW',
    inputs: [
      {
        id: 'scheduleCadence',
        label: 'Cadence',
        kind: 'text',
        helper: 'Type WEEKLY or MONTHLY.',
        placeholder: 'WEEKLY',
        defaultValue: 'WEEKLY',
      },
      {
        id: 'scheduleDayOfWeek',
        label: 'UTC weekday (weekly only, 0–6)',
        kind: 'number',
        min: 0,
        max: 6,
        step: 1,
        defaultValue: 5,
      },
      {
        id: 'scheduleDayOfMonth',
        label: 'Day of month (monthly only, 1–28)',
        kind: 'number',
        min: 1,
        max: 28,
        step: 1,
        defaultValue: 1,
      },
      {
        id: 'scheduleBucket',
        label: 'Destination envelope',
        kind: 'text',
        placeholder: 'auto_save',
        defaultValue: 'auto_save',
      },
      {
        id: 'scheduleAmountUsd',
        label: 'Amount (USD) per run',
        kind: 'number',
        min: 1,
        max: 500,
        step: 1,
        defaultValue: 10,
      },
    ],
  },
  CATEGORY_SPEND_TAX: {
    id: 'CATEGORY_SPEND_TAX',
    category: 'SAVINGS',
    title: 'Category spend tax',
    summary: 'Skim a percent of every purchase in one category into a separate envelope (guilt tax / self-tax).',
    guidance:
      'Matches the transaction category name exactly (case-insensitive), e.g. ENTERTAINMENT or FOOD — use the same labels you see on your ledger. Optional per-purchase cap keeps large tabs from over-taxing.',
    outcomes: [
      'Runs on each qualifying card purchase (outflow).',
      'Skips internal transfers.',
      'Stacks with round-up rules when both match.',
    ],
    premium: false,
    badge: 'NEW',
    inputs: [
      {
        id: 'taxCategory',
        label: 'Category to tax (ledger label)',
        kind: 'text',
        helper: 'Must match categoryName on transactions, e.g. ENTERTAINMENT.',
        placeholder: 'ENTERTAINMENT',
        defaultValue: 'ENTERTAINMENT',
      },
      {
        id: 'taxDestinationBucket',
        label: 'Tax envelope',
        kind: 'text',
        placeholder: 'guilt_tax',
        defaultValue: 'guilt_tax',
      },
      {
        id: 'taxSpendPercent',
        label: 'Percent of each purchase',
        kind: 'number',
        min: 1,
        max: 50,
        step: 1,
        defaultValue: 10,
      },
      {
        id: 'taxMaxAmountUsd',
        label: 'Max per purchase (USD, optional)',
        kind: 'number',
        min: 1,
        max: 500,
        step: 1,
        placeholder: '25',
      },
    ],
  },
  PAYCHECK_SAVINGS_BOOST: {
    id: 'PAYCHECK_SAVINGS_BOOST',
    category: 'SAVINGS',
    title: 'Paycheck savings boost',
    summary: 'Skim a percentage off each paycheck into a savings envelope.',
    guidance:
      'When a paycheck or direct deposit posts to a linked account, the chosen percentage is moved into the envelope you pick. Works alongside your active budget split.',
    outcomes: [
      'Only fires on paycheck-style deposits (PAYCHECK class).',
      'Other deposits are not affected by this rule.',
      'Pause anytime to stop the transfers.',
    ],
    premium: true,
    badge: 'PRO',
    inputs: [
      {
        id: 'savingsBucket',
        label: 'Destination envelope',
        kind: 'text',
        helper: 'Use an existing envelope name or create a new one (e.g. "savings", "emergency").',
        placeholder: 'savings',
        defaultValue: 'savings',
      },
      {
        id: 'savingsPercent',
        label: 'Percent of each paycheck',
        kind: 'number',
        min: 1,
        max: 50,
        step: 1,
        defaultValue: 10,
      },
    ],
  },
  TAX_RESERVE_ON_SELF_EMPLOYED: {
    id: 'TAX_RESERVE_ON_SELF_EMPLOYED',
    category: 'TAXES',
    title: 'Tax reserve on self-employed income',
    summary: 'Set aside taxes on every gig or contractor payment.',
    guidance:
      'When a gig payout or contractor payment lands (Uber, DoorDash, Stripe, Upwork, etc.) the chosen percentage is moved into your tax reserve envelope. Doesn\'t touch W-2 paychecks.',
    outcomes: [
      'Only fires on GIG_PAYMENT or CONTRACTOR_PAYMENT deposits.',
      'Recommended share is 25–30% if you have no other tax withholding.',
      'Pause anytime to redirect future payouts elsewhere.',
    ],
    premium: true,
    badge: 'PRO',
    inputs: [
      {
        id: 'reserveBucket',
        label: 'Tax reserve envelope',
        kind: 'text',
        placeholder: 'taxes',
        defaultValue: 'taxes',
      },
      {
        id: 'reservePercent',
        label: 'Percent to reserve',
        kind: 'number',
        min: 5,
        max: 50,
        step: 1,
        defaultValue: 25,
      },
    ],
  },
  CATEGORY_GUARDRAIL: {
    id: 'CATEGORY_GUARDRAIL',
    category: 'GUARDRAIL',
    title: 'Spending guardrail',
    summary: 'Get warned before you blow past a monthly category cap.',
    guidance:
      'Set a monthly limit for one spending category. You\'ll be alerted when you reach the warning threshold, and again if the cap is exceeded. Nothing is blocked or moved automatically.',
    outcomes: [
      'Alert fires once spend hits your warning threshold (default 80%).',
      'A second alert fires once the cap is breached.',
      'Pause anytime to stop alerts.',
    ],
    premium: false,
    inputs: [
      {
        id: 'guardrailCategory',
        label: 'Category name',
        kind: 'text',
        helper: 'Matches the category names on your transactions (e.g. "FOOD", "ENTERTAINMENT").',
        placeholder: 'FOOD',
      },
      {
        id: 'guardrailLimit',
        label: 'Monthly limit (USD)',
        kind: 'number',
        min: 25,
        step: 25,
        defaultValue: 400,
      },
      {
        id: 'guardrailWarnAt',
        label: 'Warn at percent of limit',
        kind: 'number',
        min: 50,
        max: 100,
        step: 5,
        defaultValue: 80,
      },
    ],
  },
};

export function listRuleTemplates(): RuleTemplateDescriptor[] {
  return Object.values(TEMPLATES);
}

export function getRuleTemplate(id: RuleTemplateId): RuleTemplateDescriptor | null {
  return TEMPLATES[id] ?? null;
}

/** Templates the user can instantiate given their subscription level. */
export function availableRuleTemplates(
  subscriptionLevel?: SubscriptionLevel | null
): Array<RuleTemplateDescriptor & { locked: boolean }> {
  const premium = hasAdvancedAutomationAccess(subscriptionLevel);
  return listRuleTemplates().map(t => ({ ...t, locked: t.premium && !premium }));
}

export function isAllocationPercentSumValid(actions: AllocationLine[]): boolean {
  if (actions.length === 0) return false;
  const total = actions.reduce((sum, a) => sum + (Number.isFinite(a.percent) ? a.percent : 0), 0);
  return Math.abs(total - 100) <= 0.05;
}

/** Normalize a free-form bucket label to the canonical lowercase slug the engine writes. */
export function normalizeBucketSlug(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '_');
}

function incomeAllocationConditions() {
  return {
    directions: ['INFLOW'],
    excludeTransfers: true,
    operationalClasses: [...INCOME_ELIGIBLE_CLASSES],
  };
}

function paycheckOnlyAllocationConditions() {
  return {
    directions: ['INFLOW'],
    excludeTransfers: true,
    operationalClasses: ['PAYCHECK'],
  };
}

function selfEmployedAllocationConditions() {
  return {
    directions: ['INFLOW'],
    excludeTransfers: true,
    operationalClasses: ['GIG_PAYMENT', 'CONTRACTOR_PAYMENT'],
  };
}

function spendRoundUpConditions() {
  return {
    allocationMode: SPEND_ROUND_UP_ALLOCATION_MODE,
    directions: ['OUTFLOW'],
    excludeTransfers: true,
  };
}

export function buildRuleFromTemplate(
  templateId: RuleTemplateId,
  input: TemplateInstantiationInput,
  ctx: { subscriptionLevel?: SubscriptionLevel | null }
): TemplateBuildResult {
  const template = getRuleTemplate(templateId);
  if (!template) {
    throw new Error(`Unknown rule template: ${templateId}`);
  }

  const premium = hasAdvancedAutomationAccess(ctx.subscriptionLevel);
  if (template.premium && !premium) {
    throw new Error(`Template ${templateId} requires a Pro subscription.`);
  }

  switch (template.id) {
    case 'BUDGET_SPLIT_50_30_20':
      return {
        rulePayload: {
          name: '50 / 30 / 20 budget split',
          type: 'ALLOCATION',
          triggerType: 'TRANSACTION_POSTED',
          conditions: incomeAllocationConditions(),
          enabled: true,
          allocationPreset: 'FIFTY_THIRTY_TWENTY',
        },
      };

    case 'BUDGET_SPLIT_40_30_30':
      // Free-tier accounts already hit the premium guard above; this preset only ships to Pro.
      return {
        rulePayload: {
          name: '40 / 30 / 30 budget split',
          type: 'ALLOCATION',
          triggerType: 'TRANSACTION_POSTED',
          conditions: incomeAllocationConditions(),
          enabled: true,
          actions: [...ALLOCATION_FREE_PRESET_ACTIONS.FORTY_THIRTY_THIRTY],
        },
      };

    case 'BUDGET_SPLIT_CUSTOM': {
      const raw = input.allocationsCustom ?? [];
      const cleaned = raw
        .map(line => ({
          bucket: normalizeBucketSlug(String(line.bucket ?? '')),
          percent: Math.round(Number(line.percent) * 100) / 100,
        }))
        .filter(line => line.bucket.length > 0 && Number.isFinite(line.percent));
      if (!isAllocationPercentSumValid(cleaned)) {
        throw new Error('Custom budget split percentages must total 100%.');
      }
      return {
        rulePayload: {
          name: 'Custom budget split',
          type: 'ALLOCATION',
          triggerType: 'TRANSACTION_POSTED',
          conditions: incomeAllocationConditions(),
          actions: cleaned,
          enabled: true,
        },
      };
    }

    case 'SPEND_ROUND_UP_SAVINGS': {
      const bucket = normalizeBucketSlug(String(input.roundUpBucket ?? 'round_up'));
      const increment = Number(input.roundUpIncrement ?? 1);
      if (!bucket) {
        throw new Error('Round-up envelope is required.');
      }
      if (!Number.isFinite(increment) || increment < 0.5 || increment > 100) {
        throw new Error('Round-up increment must be between 0.5 and 100.');
      }
      return {
        rulePayload: {
          name: `Round up spend → ${bucket}`,
          type: 'ALLOCATION',
          triggerType: 'TRANSACTION_POSTED',
          conditions: spendRoundUpConditions(),
          actions: [{ bucket, increment, mode: 'ROUND_UP' as const }],
          enabled: true,
        },
      };
    }

    case 'SCHEDULED_FIXED_SAVE_USD': {
      const bucket = normalizeBucketSlug(String(input.scheduleBucket ?? 'auto_save'));
      const amountUsd = Number(input.scheduleAmountUsd ?? 10);
      const cadenceRaw = String(input.scheduleCadence ?? 'WEEKLY').trim().toUpperCase();
      if (cadenceRaw !== 'WEEKLY' && cadenceRaw !== 'MONTHLY') {
        throw new Error('Cadence must be WEEKLY or MONTHLY.');
      }
      if (!bucket) {
        throw new Error('Destination envelope is required.');
      }
      if (!Number.isFinite(amountUsd) || amountUsd < 1 || amountUsd > 500) {
        throw new Error('Amount must be between 1 and 500 USD.');
      }
      const dow = Number(input.scheduleDayOfWeek ?? 5);
      const dom = Number(input.scheduleDayOfMonth ?? 1);
      if (!Number.isFinite(dow) || dow < 0 || dow > 6) {
        throw new Error('UTC weekday must be between 0 and 6.');
      }
      if (!Number.isFinite(dom) || dom < 1 || dom > 28) {
        throw new Error('Day of month must be between 1 and 28.');
      }
      const schedule =
        cadenceRaw === 'WEEKLY'
          ? { cadence: 'WEEKLY' as const, dayOfWeek: Math.round(dow) }
          : { cadence: 'MONTHLY' as const, dayOfMonth: Math.round(dom) };
      return {
        rulePayload: {
          name: `Fixed save $${amountUsd.toFixed(0)} → ${bucket} (${cadenceRaw})`,
          type: 'ALLOCATION',
          triggerType: 'SCHEDULED',
          conditions: { allocationMode: FIXED_SCHEDULE_ALLOCATION_MODE },
          schedule,
          actions: [{ bucket, amountUsd, mode: 'FIXED_AMOUNT_USD' as const }],
          enabled: true,
        },
      };
    }

    case 'CATEGORY_SPEND_TAX': {
      const cat = String(input.taxCategory ?? '').trim().toUpperCase();
      const bucket = normalizeBucketSlug(String(input.taxDestinationBucket ?? 'guilt_tax'));
      const spendPercent = Number(input.taxSpendPercent ?? 10);
      const maxRaw = input.taxMaxAmountUsd;
      const maxAmountUsd =
        maxRaw === undefined || maxRaw === null || (typeof maxRaw === 'number' && Number.isNaN(maxRaw))
          ? undefined
          : Number(maxRaw);
      if (!cat) {
        throw new Error('Category to tax is required.');
      }
      if (!bucket) {
        throw new Error('Tax envelope is required.');
      }
      if (!Number.isFinite(spendPercent) || spendPercent <= 0 || spendPercent > 50) {
        throw new Error('Spend percent must be between 1 and 50.');
      }
      if (maxAmountUsd != null && (!Number.isFinite(maxAmountUsd) || maxAmountUsd <= 0)) {
        throw new Error('Max per purchase must be a positive number when set.');
      }
      const action: Record<string, unknown> = {
        bucket,
        spendPercent,
        mode: 'SPEND_PERCENT',
      };
      if (maxAmountUsd != null && Number.isFinite(maxAmountUsd) && maxAmountUsd > 0) {
        action.maxAmountUsd = maxAmountUsd;
      }
      return {
        rulePayload: {
          name: `Spend tax ${spendPercent}% · ${cat} → ${bucket}`,
          type: 'ALLOCATION',
          triggerType: 'TRANSACTION_POSTED',
          conditions: {
            allocationMode: CATEGORY_SPEND_TAX_ALLOCATION_MODE,
            directions: ['OUTFLOW'],
            excludeTransfers: true,
            categoryNames: [cat],
          },
          actions: [action],
          enabled: true,
        },
      };
    }

    case 'PAYCHECK_SAVINGS_BOOST': {
      const bucket = normalizeBucketSlug(String(input.savingsBucket ?? 'savings'));
      const percent = Number(input.savingsPercent ?? 10);
      if (!Number.isFinite(percent) || percent <= 0 || percent > 50) {
        throw new Error('Paycheck savings percent must be between 1 and 50.');
      }
      if (!bucket) {
        throw new Error('Destination envelope is required.');
      }
      return {
        rulePayload: {
          name: `Paycheck savings boost (${percent}% → ${bucket})`,
          type: 'ALLOCATION',
          triggerType: 'TRANSACTION_POSTED',
          conditions: paycheckOnlyAllocationConditions(),
          actions: [
            { bucket, percent },
            { bucket: 'unallocated', percent: 100 - percent },
          ],
          enabled: true,
        },
      };
    }

    case 'TAX_RESERVE_ON_SELF_EMPLOYED': {
      const bucket = normalizeBucketSlug(String(input.reserveBucket ?? 'taxes'));
      const percent = Number(input.reservePercent ?? 25);
      if (!Number.isFinite(percent) || percent <= 0 || percent > 50) {
        throw new Error('Tax reserve percent must be between 1 and 50.');
      }
      if (!bucket) {
        throw new Error('Tax reserve envelope is required.');
      }
      return {
        rulePayload: {
          name: `Tax reserve (${percent}% → ${bucket})`,
          type: 'ALLOCATION',
          triggerType: 'TRANSACTION_POSTED',
          conditions: selfEmployedAllocationConditions(),
          actions: [
            { bucket, percent },
            { bucket: 'unreserved_self_employed', percent: 100 - percent },
          ],
          enabled: true,
        },
      };
    }

    case 'CATEGORY_GUARDRAIL': {
      const category = String(input.guardrailCategory ?? '').trim();
      const limit = Number(input.guardrailLimit ?? 0);
      const warnAt = Number(input.guardrailWarnAt ?? 80);
      if (!category) {
        throw new Error('Guardrail category is required.');
      }
      if (!Number.isFinite(limit) || limit <= 0) {
        throw new Error('Guardrail limit must be a positive amount.');
      }
      if (!Number.isFinite(warnAt) || warnAt < 50 || warnAt > 100) {
        throw new Error('Warning threshold must be between 50 and 100.');
      }
      return {
        rulePayload: {
          name: `Guardrail · ${category} ($${limit.toFixed(0)})`,
          type: 'GUARDRAIL',
          triggerType: 'TRANSACTION_POSTED',
          conditions: { directions: ['OUTFLOW'], excludeTransfers: true },
          actions: [{ warnAtPercent: warnAt, categoryName: category }],
          enabled: true,
        },
        guardrailPolicy: {
          categoryName: category,
          limitAmount: limit,
          warnAtPercent: warnAt,
        },
      };
    }

    default:
      throw new Error(`Unhandled rule template: ${template.id}`);
  }
}

export const ALLOCATION_FREE_PRESET_ACTIONS = ALLOCATION_FREE_PRESETS;
