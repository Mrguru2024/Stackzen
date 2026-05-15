import type { IncomeProfileType } from '@prisma/client';
import type { AdaptiveNextAction, DerivedActivationSteps } from '@/lib/operational-activation/types';

/**
 * Ordered contextual next actions — each links to a real workflow surface.
 */
export function buildAdaptiveNextActions(
  derived: DerivedActivationSteps,
  _profiles: IncomeProfileType[],
  dismissedKeys: Set<string>,
  progressiveTier: number
): AdaptiveNextAction[] {
  const actions: AdaptiveNextAction[] = [];

  if (!derived.income_profile_selected) {
    actions.push({
      key: 'nba_income_profile',
      priority: 10,
      title: 'Choose your income profile',
      body: 'Unlocks the right nav, shortcuts, and contractor vs paycheck workflows — tied to your real money motion.',
      href: '/onboarding',
    });
  }

  if (!derived.bank_linked) {
    actions.push({
      key: 'nba_connect_bank',
      priority: 20,
      title: 'Connect a bank feed',
      body: 'Link an account so ledger review, forecasting, and automation run on real cash timing.',
      href: '/money-control?tab=review',
    });
  }

  if (!derived.ledger_populated) {
    actions.push({
      key: 'nba_sync_ledger',
      priority: 30,
      title: 'Get transactions into the ledger',
      body: 'Run a bank sync or add ledger activity so Money Control and Cash Flow have signal.',
      href: '/money-control?tab=review',
    });
  }

  if (!derived.transactions_categorized) {
    actions.push({
      key: 'nba_categorize',
      priority: 40,
      title: 'Clean up your first ledger rows',
      body: 'Categorize a few transactions so automation and envelopes can trust category baselines.',
      href: '/money-control?tab=review',
    });
  }

  if (!derived.envelopes_or_automation) {
    actions.push({
      key: 'nba_envelopes',
      priority: 50,
      title: 'Set envelopes or automation',
      body: 'Add a Smart Allocation or enable a Money Control rule so forecast allocation drag reflects reality.',
      href: '/money-control?tab=rules',
    });
  }

  if (!derived.forecast_engaged) {
    actions.push({
      key: 'nba_forecast',
      priority: 60,
      title: 'Open your deterministic cash flow forecast',
      body: 'Cash Flow turns bills, invoices, and ledger patterns into timing risks you can act on.',
      href: '/cash-flow',
    });
  }

  if (!derived.operational_goal_created) {
    actions.push({
      key: 'nba_goal',
      priority: 70,
      title: 'Create your first operational goal',
      body: 'Goals tie pacing, buckets, and guidance into one auditable savings loop.',
      href: '/goals/operational',
    });
  }

  if (!derived.attention_queue_engaged) {
    actions.push({
      key: 'nba_attention',
      priority: 80,
      title: 'Triage one operational alert',
      body: 'Mark read, snooze, or open the linked workflow so the attention queue stays trustworthy.',
      href: '/operational-center',
    });
  }

  if (progressiveTier >= 3 && !dismissedKeys.has('nba_timeline')) {
    actions.push({
      key: 'nba_timeline',
      priority: 90,
      title: 'Review your financial event timeline',
      body: 'See how ledger, goals, and automation decisions show up as a single operational audit trail.',
      href: '/financial-timeline',
    });
  }

  const filtered = actions.filter(a => !dismissedKeys.has(a.key));
  filtered.sort((a, b) => a.priority - b.priority);
  return filtered.slice(0, 5);
}
