/**
 * Tier comparison matrix — keep in sync with docs/Build/stackzen_pricing_system.md
 * and docs/Logics/stackzen_membership_logic.md
 */
export type PlanTierKey = 'starter' | 'pro' | 'zen' | 'zenplus';

export type ComparisonCell = boolean | string;

export interface ComparisonFeature {
  label: string;
  starter: ComparisonCell;
  pro: ComparisonCell;
  zen: ComparisonCell;
  zenplus: ComparisonCell;
}

export const PLAN_COMPARISON_FEATURES: ComparisonFeature[] = [
  { label: 'Manual 40/30/30 tracker', starter: true, pro: true, zen: true, zenplus: true },
  { label: 'CSV export', starter: true, pro: true, zen: true, zenplus: true },
  {
    label: 'Financial goals',
    starter: '1',
    pro: 'Unlimited',
    zen: 'Unlimited',
    zenplus: 'Unlimited',
  },
  {
    label: 'Free mentor consults',
    starter: '1 consult',
    pro: '1/year',
    zen: '1/6mo (30min)',
    zenplus: '1-on-1/mo',
  },
  { label: 'Smart quote builder', starter: false, pro: true, zen: true, zenplus: true },
  {
    label: 'Customizable & Automated saving logics (40/30/30)',
    starter: false,
    pro: true,
    zen: true,
    zenplus: true,
  },
  { label: 'Invoicing tool', starter: false, pro: true, zen: true, zenplus: true },
  {
    label: 'Bank sync',
    starter: false,
    pro: 'Up to 3 accounts',
    zen: 'Unlimited',
    zenplus: 'Unlimited',
  },
  { label: 'Zen AI insights', starter: false, pro: false, zen: true, zenplus: true },
  { label: 'Add-on compatible', starter: false, pro: false, zen: true, zenplus: true },
  { label: '1-on-1 coaching', starter: false, pro: false, zen: false, zenplus: true },
  { label: 'Group Q&A calls', starter: false, pro: false, zen: false, zenplus: true },
  { label: 'Priority support', starter: false, pro: false, zen: false, zenplus: true },
];
