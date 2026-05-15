import type { ForecastWindowResultDto, RiskFindingDto } from '@/lib/cashflow/types';
import { getLowBalanceThresholdUsd } from '@/lib/cashflow/constants';

const severityRank = { critical: 3, warning: 2, info: 1 };

function dedupeRisks(risks: RiskFindingDto[]): RiskFindingDto[] {
  const byCode = new Map<string, RiskFindingDto>();
  for (const r of risks) {
    const existing = byCode.get(r.code);
    if (!existing) {
      byCode.set(r.code, r);
      continue;
    }
    if (severityRank[r.severity] > severityRank[existing.severity]) {
      byCode.set(r.code, r);
    }
  }
  return [...byCode.values()];
}

export function analyzeRisks(input: {
  windows: ForecastWindowResultDto[];
  weeklyAllocationEstimate: number;
  startingBalance: number;
  depositPendingJobs?: number;
}): RiskFindingDto[] {
  const threshold = getLowBalanceThresholdUsd();
  const risks: RiskFindingDto[] = [];

  const w30 = input.windows.find(w => w.windowDays === 30) ?? input.windows[input.windows.length - 1];
  if (!w30) return risks;

  const low = w30.lowestProjectedBalance;
  const lowDate = w30.lowestProjectedBalanceDate;

  if (low < threshold) {
    risks.push({
      code: 'PROJECTED_LOW_BALANCE',
      severity: low < 0 ? 'critical' : 'warning',
      summary: 'Projected balance drops below your configured cushion.',
      detail: `Lowest projected balance is $${low.toFixed(2)}${lowDate ? ` around ${new Date(lowDate).toLocaleDateString()}.` : '.'} Threshold is $${threshold.toFixed(2)} (STACKZEN_LOW_BALANCE_ALERT_USD).`,
      confidence: 0.75,
    });
  }

  const sorted = [...w30.events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const firstIn = sorted.find(e => e.direction === 'INFLOW');
  const firstOut = sorted.find(e => e.direction === 'OUTFLOW');
  if (firstOut && (!firstIn || new Date(firstOut.date) < new Date(firstIn.date))) {
    risks.push({
      code: 'BILLS_BEFORE_NEXT_INCOME',
      severity: 'warning',
      summary: 'Upcoming bills land before the first projected deposit in the 30-day window.',
      detail: firstIn
        ? `Earliest outflow is ${new Date(firstOut.date).toLocaleDateString()} while first modeled inflow is ${new Date(firstIn.date).toLocaleDateString()}.`
        : `Outflows start ${new Date(firstOut.date).toLocaleDateString()} before any modeled inflows.`,
      confidence: firstIn ? 0.65 : 0.55,
    });
  }

  const byDay = new Map<string, number>();
  for (const e of w30.events) {
    if (e.direction !== 'OUTFLOW') continue;
    const k = new Date(e.date).toDateString();
    byDay.set(k, (byDay.get(k) ?? 0) + 1);
  }
  for (const [, count] of byDay) {
    if (count >= 3) {
      risks.push({
        code: 'BILL_CLUSTER',
        severity: 'warning',
        summary: 'Multiple bills cluster on the same day.',
        detail:
          'Three or more projected outflows share a calendar day in the 30-day projection. Consider spreading payments or padding balance.',
        confidence: 0.7,
      });
      break;
    }
  }

  const alloc = input.weeklyAllocationEstimate;
  if (
    alloc > 0 &&
    input.startingBalance > 0 &&
    w30.lowestProjectedBalance < input.startingBalance - alloc * 2
  ) {
    risks.push({
      code: 'ALLOCATION_PRESSURE',
      severity: 'info',
      summary: 'Automation allocations may compress usable cash.',
      detail: `Trailing ~4-week allocation pace is ~$${alloc.toFixed(2)}/week; combined with obligations this stresses the projected minimum.`,
      confidence: 0.55,
    });
  }

  const ending = w30.projectedEndingBalance;
  const invoicedIn = w30.expectedIncomeTotal;
  if (invoicedIn > 0 && ending < invoicedIn * 0.25) {
    risks.push({
      code: 'INVOICE_RECEIVABLE_GAP',
      severity: 'info',
      summary: 'Even with modeled invoice receipts, ending liquidity stays thin.',
      detail:
        'Invoice payments are modeled on due dates—if clients pay late, actual balances may be lower than projected ending balance.',
      confidence: 0.45,
    });
  }

  const depJobs = input.depositPendingJobs ?? 0;
  if (depJobs > 0 && low < threshold) {
    risks.push({
      code: 'DEPOSIT_RUNWAY_WARNING',
      severity: 'warning',
      summary: 'Deposit-required work overlaps with a thin projected balance.',
      detail: `There ${depJobs === 1 ? 'is' : 'are'} ${depJobs} job(s) awaiting deposit while projected cash nears your cushion.`,
      confidence: 0.6,
    });
  }

  return dedupeRisks(risks);
}
